/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";
$.fn.modal = jest.fn();

// On mock la fonction bills du store
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  // On initialise les éléments nécessaires avant chaque test
  beforeEach(() => {
    // On simule le localStorage et on met un utilisateur de type "Employee"
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        status: "connected",
      })
    );
    // On crée et attache la structure HTML de base à document.body
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router(); // On initialise le routeur pour naviguer entre les pages
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // On navigue vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
      // On attend que l'icône de fenêtre soit affichée
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // On vérifie que l'icône de fenêtre a bien la classe "active-icon"
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      // On injecte le HTML de BillsUI avec des données de factures
      document.body.innerHTML = BillsUI({ data: bills });
      // On récupère toutes les dates affichées dans les factures
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      // On crée une fonction de tri anti-chronologique
      const antiChrono = (a, b) => b - a;
      // On trie les dates de manière anti-chronologique
      const datesSorted = [...dates].sort(antiChrono);
      // On vérifie que les dates affichées sont bien triées
      expect(dates).toEqual(datesSorted);
    });

    test("When I click on the 'new bill' button, it should navigate to NewBill page", () => {
      // On injecte le HTML de BillsUI avec des données de factures
      document.body.innerHTML = BillsUI({ data: bills });
      // On simule la fonction de navigation
      const onNavigate = jest.fn();
      // On crée une instance de Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      // On récupère le bouton "Nouvelle note de frais"
      const newBillButton = screen.getByTestId("btn-new-bill");
      // On simule le clic sur le bouton
      userEvent.click(newBillButton);
      // On vérifie que la fonction de navigation a bien été appelée avec le bon chemin
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("When I click on the 'eye' icon, the modal should open", () => {
      // On injecte le HTML de BillsUI avec des données de factures
      document.body.innerHTML = BillsUI({ data: bills });
      // On simule la fonction de navigation
      const onNavigate = jest.fn();
      // On crée une instance de Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      // On mock la fonction modal de Bootstrap
      $.fn.modal = jest.fn();
      // On récupère la première icône "œil"
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      // On simule le clic sur l'icône "œil"
      userEvent.click(iconEye);
      // On vérifie que la fonction modal a bien été appelée
      expect($.fn.modal).toHaveBeenCalled();
    });

    // On test les erreurs de l'API
    test("fetches bills from mock API and fails with 404 message error", async () => {
      // Création d'une erreur simulée avec un message "Erreur 404"
      const authErrorMock = new Error("Erreur 404");

      // Espionner la méthode list du magasin et la faire renvoyer une erreur simulée
      jest
        .spyOn(mockStore.bills(), "list")
        .mockRejectedValueOnce(authErrorMock);

      // On navigue vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
      // On attend la prochaine étape dans la boucle d'événements
      await new Promise(process.nextTick);
      // On vérifie que le message d'erreur 404 est affiché
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    // On test les erreurs de l'API (500)
    test("fetches bills from mock API and fails with 500 message error", async () => {
      // Création d'une erreur simulée avec un message "Erreur 500"
      const authErrorMock = new Error("Erreur 500");

      // Espionner la méthode list du magasin et la faire renvoyer une erreur simulée
      jest
        .spyOn(mockStore.bills(), "list")
        .mockRejectedValueOnce(authErrorMock);

      // On navigue vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
      // On attend la prochaine étape dans la boucle d'événements
      await new Promise(process.nextTick);
      // On vérifie que le message d'erreur 500 est affiché
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});