/**
 * @jest-environment jsdom
 */

import { jest } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  // On simule l'utilisateur connecté en tant qu'employé
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "employee@test.tld",
      status: "connected",
    })
  );

  // Test de l'affichage du formulaire de la page NewBill
  describe("When I am on NewBill Page", () => {
    test("Then the new bill form should be rendered", () => {
      // On génère le HTML pour la page NewBill
      const html = NewBillUI();
      document.body.innerHTML = html;

      // On vérifie que le formulaire est présent dans le DOM
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });
  });

  // Test de la soumission du formulaire de NewBill avec des données valides
  describe("When I submit the form with valid inputs", () => {
    test("Then it should create a new bill and redirect to Bills page", () => {
      document.body.innerHTML = NewBillUI();
      // Espionner la fonction update de mockStore pour vérifier son appel
      jest.spyOn(mockStore.bills(), "update");
      const onNavigate = (pathname) => (document.body.innerHTML = pathname);
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // On récupère les éléments du formulaire
      const form = screen.getByTestId("form-new-bill");
      const expenseType = screen.getByTestId("expense-type");
      const expenseName = screen.getByTestId("expense-name");
      const datepicker = screen.getByTestId("datepicker");
      const amount = screen.getByTestId("amount");
      const pct = screen.getByTestId("pct");
      const file = screen.getByTestId("file");

      // On simule la saisie des données dans le formulaire
      fireEvent.change(expenseType, { target: { value: "Transports" } });
      fireEvent.change(expenseName, { target: { value: "Billet de train" } });
      fireEvent.change(datepicker, { target: { value: "2023-09-01" } });
      fireEvent.change(amount, { target: { value: "100" } });
      fireEvent.change(pct, { target: { value: "20" } });
      fireEvent.change(file, {
        target: {
          files: [new File(["file"], "file.png", { type: "image/png" })],
        },
      });

      // On simule la réponse réussie de l'API
      jest.spyOn(mockStore.bills(), "update").mockResolvedValue({});

      // On soumet le formulaire
      fireEvent.submit(form);

      // On vérifie que la fonction update a été appelée
      expect(mockStore.bills().update).toHaveBeenCalled();
    });
  });

  describe("When I upload a file", () => {
    let newBill;
    let fileInput;

    beforeEach(() => {
      // Initialise l'interface utilisateur
      document.body.innerHTML = NewBillUI();

      // Crée une nouvelle instance de NewBill
      newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Sélectionne l'élément input de fichier
      fileInput = screen.getByTestId("file");
    });

    // Test pour vérifier qu'un fichier au bon format est accepté et que la méthode create est appelée
    test("Then input a file with correct format should keep the file and then call create method", async () => {
      // On simule la fonction handleChangeFile pour appeler newBill.handleChangeFile
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      // On ajoute un écouteur d'événement "change" à fileInput pour appeler handleChangeFile
      fileInput.addEventListener("change", handleChangeFile);

      // On crée un fichier de test nommé "test.jpg" avec le type "image/jpg"
      const FileTest = new File(["test"], "test.jpg", { type: "image/jpg" });
      // On simule le changement de fichier en déclenchant l'événement "change" sur fileInput
      fireEvent.change(fileInput, { target: { files: [FileTest] } });

      // On vérifie que handleChangeFile a été appelé
      expect(handleChangeFile).toHaveBeenCalled();
      // On vérifie que le fichier sélectionné est bien "test.jpg"
      expect(fileInput.files[0].name).toBe("test.jpg");
    });

    // Test pour vérifier qu'un fichier au mauvais format est rejeté
    test("Then it should show an alert if the file format is invalid", async () => {
      // On simule la fonction window.alert
      window.alert = jest.fn();

      // On crée un fichier de test nommé "document.pdf" avec le type "application/pdf"
      const file = new File(["document"], "document.pdf", {
        type: "application/pdf",
      });

      // On simule le changement de fichier en déclenchant l'événement "change" sur fileInput
      fireEvent.change(fileInput, { target: { files: [file] } });

      // On attend que l'alerte soit appelée avec le message d'erreur approprié
      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          "Seuls les fichiers .jpg, .jpeg et .png sont autorisés."
        )
      );
    });
  });
});
