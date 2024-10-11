import { formatDate, formatStatus } from "../app/format.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      );
    $("#modaleFile").modal("show");
  };

  getBills = () => {
    // On vérifie si 'store' existe
    if (this.store) {
      // On récupère la liste des factures depuis le store
      return this.store
        .bills() // On accède à la section 'bills' du store
        .list() // On appelle la méthode 'list' pour obtenir toutes les factures
        .then((snapshot) => {
          // On trie les factures par date décroissante (de la plus récente à la plus ancienne)
          const bills = snapshot
          .sort((a, b) => {
            const dateA = new Date(a.date); // Utilise le constructeur Date pour créer des objets Date
            const dateB = new Date(b.date);
            return dateB - dateA; // Compare directement les objets Date
          })
            // On reformate chaque facture en modifiant la date et le statut
            .map((doc) => {
              try {
                return {
                  ...doc, // On conserve les autres propriétés de la facture
                  date: formatDate(doc.date), // On reformate la date de la facture
                  status: formatStatus(doc.status), // On reformate le statut de la facture
                };
              } catch (e) {
                // if for some reason, corrupted data was introduced, we manage here failing formatDate function
                // log the error and return unformatted date in that case
                console.log(e, "for", doc);
                return {
                  ...doc,
                  date: doc.date,
                  status: formatStatus(doc.status),
                };
              }
            });
          console.log("length", bills.length);
          console.log("bills", bills);
          return bills;
        });
    }
  };
}
