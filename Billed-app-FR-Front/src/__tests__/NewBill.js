/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import { jest } from '@jest/globals'

// On simule l'utilisateur connecté en tant qu'employé
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

describe("Given I am connected as an employee", () => {

  // Test de l'affichage du formulaire de la page NewBill
  describe("When I am on NewBill Page", () => {
    test("Then the new bill form should be rendered", () => {
      // On génère le HTML pour la page NewBill
      const html = NewBillUI()
      document.body.innerHTML = html

      // On vérifie que le formulaire est présent dans le DOM
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
    })
  })

  // Test de la soumission du formulaire de NewBill avec des données valides
  describe("When I submit the form with valid inputs", () => {
    test("Then it should create a new bill and redirect to Bills page", () => {
      document.body.innerHTML = NewBillUI()
      // Espionner la fonction update de mockStore pour vérifier son appel
      jest.spyOn(mockStore.bills(), "update")
      const onNavigate = (pathname) => document.body.innerHTML = pathname
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // On récupère les éléments du formulaire
      const form = screen.getByTestId("form-new-bill")
      const expenseType = screen.getByTestId("expense-type")
      const expenseName = screen.getByTestId("expense-name")
      const datepicker = screen.getByTestId("datepicker")
      const amount = screen.getByTestId("amount")
      const pct = screen.getByTestId("pct")
      const file = screen.getByTestId("file")

      // On simule la saisie des données dans le formulaire
      fireEvent.change(expenseType, { target: { value: 'Transports' } })
      fireEvent.change(expenseName, { target: { value: 'Billet de train' } })
      fireEvent.change(datepicker, { target: { value: '2023-09-01' } })
      fireEvent.change(amount, { target: { value: '100' } })
      fireEvent.change(pct, { target: { value: '20' } })
      fireEvent.change(file, { target: { files: [new File(['file'], 'file.png', { type: 'image/png' })] } })

      // On simule la réponse réussie de l'API
      jest.spyOn(mockStore.bills(), "update").mockResolvedValue({})

      // On soumet le formulaire
      fireEvent.submit(form)

      // On vérifie que la fonction update a été appelée
      expect(mockStore.bills().update).toHaveBeenCalled()
    })
  })

  // Test de l'upload d'un fichier
  describe("When I upload a file", () => {
    test("Then it should store the file and update the bill", async () => {
      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => document.body.innerHTML = pathname
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // On récupère l'input de fichier et on simule l'ajout d'un fichier
      const fileInput = screen.getByTestId("file")
      const file = new File(['image'], 'image.png', { type: 'image/png' })

      // On simule la réponse de l'API pour l'upload de fichier
      jest.spyOn(mockStore.bills(), "create").mockResolvedValue({
        fileUrl: 'https://localhost:3456/images/image.png',
        key: '1234'
      })

      // On simule l'événement de changement de fichier
      fireEvent.change(fileInput, { target: { files: [file] } })

      // On attend que le fileUrl soit mis à jour
      await waitFor(() => expect(newBill.fileUrl).toBe('https://localhost:3456/images/image.png'))
      expect(newBill.fileName).toBe('image.png')
    })
  })

  // // Test de gestion des erreurs 404 et 500 lors de la soumission du formulaire
  // describe("When an error occurs on API", () => {
  //   test("Then it should handle 404 error", async () => {
  //     jest.spyOn(mockStore, "bills")
  //     mockStore.bills.mockImplementationOnce(() => {
  //       return {
  //         update: () => Promise.reject(new Error("Erreur 404"))
  //       }
  //     })

  //     document.body.innerHTML = NewBillUI()
  //     const onNavigate = (pathname) => document.body.innerHTML = pathname
  //     const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

  //     const form = screen.getByTestId("form-new-bill")
  //     fireEvent.submit(form)

  //     await waitFor(() => {
  //       // On vérifie que le message d'erreur 404 est affiché
  //       const message = screen.getByText(/Erreur 404/)
  //       expect(message).toBeTruthy()
  //     })
  //   })

  //   test("Then it should handle 500 error", async () => {
  //     jest.spyOn(mockStore, "bills")
  //     mockStore.bills.mockImplementationOnce(() => {
  //       return {
  //         update: () => Promise.reject(new Error("Erreur 500"))
  //       }
  //     })

  //     document.body.innerHTML = NewBillUI()
  //     const onNavigate = (pathname) => document.body.innerHTML = pathname
  //     const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

  //     const form = screen.getByTestId("form-new-bill")
  //     fireEvent.submit(form)

  //     await waitFor(() => {
  //       // On vérifie que le message d'erreur 500 est affiché
  //       const message = screen.getByText(/Erreur 500/)
  //       expect(message).toBeTruthy()
  //     })
  //   })
  // })
})

