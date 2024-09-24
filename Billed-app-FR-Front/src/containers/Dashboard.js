import { formatDate } from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import { ROUTES_PATH } from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from "./Logout.js"

// On filtre les factures en fonction de leur statut (pending, accepted, refused) et on exclut les emails des utilisateurs de test
export const filteredBills = (data, status) => {
  return (data && data.length) ?
    data.filter(bill => {
      let selectCondition

      // On vérifie si on est en environnement de test (Jest)
      if (typeof jest !== 'undefined') {
        selectCondition = (bill.status === status)
      }
      /* istanbul ignore next */
      else {
        // En production, on récupère l'email de l'utilisateur connecté
        const userEmail = JSON.parse(localStorage.getItem("user")).email
        // On filtre les factures pour exclure celles des utilisateurs test et de l'utilisateur actuel
        selectCondition =
          (bill.status === status) &&
          ![...USERS_TEST, userEmail].includes(bill.email)
      }

      return selectCondition
    }) : []
}

// On crée la carte d'affichage d'une facture avec ses détails (nom, montant, date, etc.)
export const card = (bill) => {
  const firstAndLastNames = bill.email.split('@')[0]
  const firstName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[0] : ''
  const lastName = firstAndLastNames.includes('.') ?
  firstAndLastNames.split('.')[1] : firstAndLastNames

  return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

// On crée un ensemble de cartes à partir d'une liste de factures
export const cards = (bills) => {
  return bills && bills.length ? bills.map(bill => card(bill)).join("") : ""
}

// On récupère le statut des factures en fonction de l'index (1 = pending, 2 = accepted, 3 = refused)
export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending"
    case 2:
      return "accepted"
    case 3:
      return "refused"
  }
}

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    // On attache des événements de clic pour afficher les factures en attente, acceptées et refusées
    $('#arrow-icon1').click((e) => this.handleShowTickets(e, bills, 1))
    $('#arrow-icon2').click((e) => this.handleShowTickets(e, bills, 2))
    $('#arrow-icon3').click((e) => this.handleShowTickets(e, bills, 3))
    // On initialise la déconnexion de l'utilisateur
    new Logout({ localStorage, onNavigate })
  }

  // On affiche la modal avec l'image de la facture quand on clique sur l'icône "œil"
  handleClickIconEye = () => {
    const billUrl = $('#icon-eye-d').attr("data-bill-url")
    const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8)
    $('#modaleFileAdmin1').find(".modal-body").html(`<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`)
    if (typeof $('#modaleFileAdmin1').modal === 'function') $('#modaleFileAdmin1').modal('show')
  }

  // On attache des événements de clic pour modifier la facture sélectionnée
  handleEditTicket(e, bill, bills) {
    if (this.counter === undefined || this.id !== bill.id) this.counter = 0
    if (this.id === undefined || this.id !== bill.id) this.id = bill.id
    // On gère l'affichage du formulaire de modification ou de l'icône Big Billed selon le nombre de clics
    if (this.counter % 2 === 0) {
      bills.forEach(b => {
        $(`#open-bill${b.id}`).css({ background: '#0D5AE5' })
      })
      $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })
      $('.dashboard-right-container div').html(DashboardFormUI(bill))
      $('.vertical-navbar').css({ height: '150vh' })
      this.counter ++
    } else {
      $(`#open-bill${bill.id}`).css({ background: '#0D5AE5' })

      $('.dashboard-right-container div').html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `)
      $('.vertical-navbar').css({ height: '120vh' })
      this.counter ++
    }
    // On attache les événements de clic pour voir l'image de la facture et pour accepter ou refuser la facture
    $('#icon-eye-d').click(this.handleClickIconEye)
    $('#btn-accept-bill').click((e) => this.handleAcceptSubmit(e, bill))
    $('#btn-refuse-bill').click((e) => this.handleRefuseSubmit(e, bill))
  }

  // On soumet la facture avec le statut accepté
  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'accepted',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // On soumet la facture avec le statut refusé
  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'refused',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // On affiche ou masque les factures selon leur statut lorsqu'on clique sur une flèche
  handleShowTickets(e, bills, index) {
    this.counters = this.counters || {};
    if (!this.counters[index]) this.counters[index] = 0;
    
    // On vérifie si on doit afficher ou cacher la liste des factures
    if (this.counters[index] % 2 === 0) {
      $(`#arrow-icon${index}`).css({ transform: 'rotate(0deg)' });
      $(`#status-bills-container${index}`)
        .html(cards(filteredBills(bills, getStatus(index))))
      this.counters[index]++;
      
      // On attache un événement de clic à chaque facture affichée pour permettre la modification
      bills.forEach(bill => {
        $(`#open-bill${bill.id}`).off('click'); // On désactive les anciens événements pour éviter les doublons
        $(`#open-bill${bill.id}`).on('click', (e) => this.handleEditTicket(e, bill, bills));
      });
      
    } else {
      $(`#arrow-icon${index}`).css({ transform: 'rotate(90deg)' });
      $(`#status-bills-container${index}`).html(""); // On cache les factures
      this.counters[index]++;
    }
  
    return bills;
  }

  // On récupère toutes les factures des utilisateurs
  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
      .bills()
      .list()
      .then(snapshot => {
        const bills = snapshot
        .map(doc => ({
          id: doc.id,
          ...doc,
          date: doc.date,
          status: doc.status
        }))
        return bills
      })
      .catch(error => {
        throw error;
      })
    }
  }

  // On met à jour la facture en base de données
  updateBill = (bill) => {
    if (this.store) {
    return this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: bill.id})
      .then(bill => bill)
      .catch(console.log)
    }
  }
}
