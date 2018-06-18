'use strict';

const rest = require( 'rest' );
const mime = require( 'rest/interceptor/mime' );
const basicAuth = require( 'rest/interceptor/basicAuth' );
const fastXmlParser = require( 'fast-xml-parser' );
const api = rest
  .wrap( basicAuth )
  .wrap( mime );

function isRequired( name = '' ) {
  throw new Error(`Missing ${ name } parameter`);
}

class astraMarin {
  constructor( path, username, password, email ) {
    this.path = () => path;
    this.username = () => username;
    this.password = () => password;
    this.email = () => email;
    this.trip = {};
  }

  set serviceGroupID( serviceGroupID ) { this.trip.serviceGroupID = serviceGroupID; }
  get serviceGroupID() { return this.trip.serviceGroupID; }

  set serviceID( serviceID ) { this.trip.serviceID = serviceID; }
  get serviceID() { return this.trip.serviceID; }

  set eventID( eventID ) { this.trip.eventID = eventID; }
  get eventID() { return this.trip.eventID; }

  set venueID( venueID ) { this.trip.venueID = venueID; }
  get venueID() { return this.trip.venueID; }

  set categoryID( categoryID ) { this.trip.categoryID = categoryID; }
  get categoryID() { return this.trip.categoryID; }

  set categorySeatID( categorySeatID ) { this.trip.categorySeatID = categorySeatID; }
  get categorySeatID() { return this.trip.categorySeatID; }

  set seatID( seatID ) { this.trip.seatID = seatID; }
  get seatID() { return this.trip.seatID; }

  set sessionID( sessionID ) { this.trip.sessionID = sessionID; }
  get sessionID() { return this.trip.sessionID; }

  set ticketTypeID( ticketTypeID ) { this.trip.ticketTypeID = ticketTypeID; }
  get ticketTypeID() { return this.trip.ticketTypeID; }

  set paymentTypeID( paymentTypeID ) { this.trip.paymentTypeID = paymentTypeID; }
  get paymentTypeID() { return this.trip.paymentTypeID; }

  set resident( resident ) { this.trip.resident = resident; }
  get resident() { return this.trip.resident; }

  set typePriceID( typePriceID ) { this.trip.typePriceID = typePriceID; }
  get typePriceID() { return this.trip.typePriceID; }

  set orderID( orderID ) { this.trip.orderID = orderID; }
  get orderID() { return this.trip.orderID; }

  _createRequest( method, body ) {
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:int="http://localhost/InternetSaleJSON">
       <soapenv:Header/>
       <soapenv:Body>
          <int:${ method }>
            ${ body ? '<int:StringJSON>' + JSON.stringify( body ) + '</int:StringJSON>' : '' }
          </int:${ method }>
       </soapenv:Body>
    </soapenv:Envelope>`;
  }

  async _connect () {
    return await api( {
      path: this.path() + '?wsdl',
      username: this.username(),
      password: this.password()
    } ).then( () => {
      return this;
    } )
  }

  // 1
  async _getServiceGroup() {
    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'GetServiceGroup' ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._getServiceGroup = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:GetServiceGroupResponse']['m:return']['d4p1:ServiceType']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 2
  async _servicesOnDate( dateFrom = isRequired( 'dateFrom' ), dateTo = '', serviceGroupID = '' ) {
    this.trip.serviceGroupID = serviceGroupID || this.trip.serviceGroupID;

    const request = {
      Date_From       : dateFrom.toISOString(),
      ServiceGroup_ID : this.trip.serviceGroupID,
      Email           : this.email(),
    };

    if ( dateTo ) {
      request.Date_To = dateTo.toISOString();
    }

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'ServicesOnDate', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._servicesOnDate = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:ServicesOnDateResponse']['m:return']['d4p1:Services']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 3
  async _EventsOnDate( date = isRequired( 'date' ), serviceID, serviceGroupID = '', eventID = '' ) {
    this.trip.serviceID = serviceID || this.trip.serviceID;
    if ( !this.trip.serviceID ) { throw new Error( 'serviceID is not defined' ); }

    this.trip.serviceGroupID = serviceGroupID || this.trip.serviceGroupID;
    if ( !this.trip.serviceGroupID ) { throw new Error( 'serviceGroupID is not defined' ); }

    this.trip.eventID = eventID || this.trip.eventID;

    const request = {
      Date            : date.toISOString(),
      Service_ID      : this.trip.serviceID,
      ServiceGroup_ID : this.trip.serviceGroupID,
      Event_ID        : this.trip.eventID,
      Email           : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'EventsOnDate', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._EventsOnDate = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:EventsOnDateResponse']['m:return']['d4p1:Event']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 4
  async _SeatСategory( venueID ) {
    this.trip.venueID = venueID || this.trip.venueID;
    if ( !this.trip.venueID ) { throw new Error( 'venueID is not defined' ); }

    const request = {
      Venue_ID : this.trip.venueID,
      Email    : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'SeatСategory', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._SeatСategory = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:Seat']['m:return']['d4p1:Seats']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 5
  async _SeatsOnEvent( eventID, categorySeatID ) {
    this.trip.eventID = eventID || this.trip.eventID;
    if ( !this.trip.eventID ) { throw new Error( 'eventID is not defined' ); }

    this.trip.categorySeatID = categorySeatID || this.trip.categorySeatID;

    const request = {
      Event_ID    : this.trip.eventID,
      Category_ID : this.trip.categorySeatID,
      Email       : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'SeatsOnEvent', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._SeatsOnEvent = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:SeatsOnEventResponse']['m:return']['d4p1:Seats']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 6
  async _BookingSeat( sessionID, eventID, seatID ) {
    this.trip.sessionID = sessionID || this.trip.sessionID;
    if ( !this.trip.sessionID ) { throw new Error( 'sessionID is not defined' ); }

    this.trip.eventID = eventID || this.trip.eventID;
    if ( !this.trip.eventID ) { throw new Error( 'eventID is not defined' ); }

    this.trip.seatID = seatID || this.trip.seatID;

    const request = {
      Event_ID   : this.trip.eventID,
      Seat_ID    : this.trip.seatID,
      Session_ID : this.trip.sessionID,
      Email      : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'BookingSeat', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._BookingSeat = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:BookingSeatResponse']['m:return']['d4p1:Book']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 7
  async _CancelBookingSeat( sessionID, eventID, seatID = '' ) {
    this.trip.sessionID = sessionID || this.trip.sessionID;
    if ( !this.trip.sessionID ) { throw new Error( 'sessionID is not defined' ); }

    this.trip.eventID = eventID || this.trip.eventID;
    if ( !this.trip.eventID ) { throw new Error( 'eventID is not defined' ); }

    this.trip.seatID = seatID || this.trip.seatID;

    const request = {
      Event_ID   : this.trip.eventID,
      Seat_ID    : this.trip.seatID,
      Session_ID : this.trip.sessionID,
      Email      : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'CancelBookingSeat', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._CancelBookingSeat = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:CancelBookingSeatResponse']['m:return']['d4p1:CancelBook']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 8
  async _GetTicketType( serviceID ) {
    this.trip.serviceID = serviceID || this.trip.serviceID;
    if ( !this.trip.serviceID ) { throw new Error( 'serviceID is not defined' ); }

    const request = {
      Service_ID : this.trip.serviceID,
      Email      : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'GetTicketType', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._GetTicketType = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:GetTicketTypeResponse']['m:return']['d4p1:TicketType']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 9
  async _GetPaymentType() {
    const request = {
      Email      : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'GetPaymentType', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._GetPaymentType = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:GetPaymentTypeResponse']['m:return']['d4p1:PaymentType']['d4p1:StringJSON'] );

      return this;
    } )
  }
  
  // 10
  async _GetSeatPrice( eventID, ticketTypeID, paymentTypeID, resident = false, seatID = '', categorySeatID = '' ) {
    this.trip.eventID = eventID || this.trip.eventID;
    if ( !this.trip.eventID ) { throw new Error( 'eventID is not defined' ); }

    this.trip.ticketTypeID = ticketTypeID || this.trip.ticketTypeID;
    if ( !this.trip.ticketTypeID ) { throw new Error( 'ticketTypeID is not defined' ); }

    this.trip.paymentTypeID = paymentTypeID || this.trip.paymentTypeID;    
    if ( !this.trip.paymentTypeID ) { throw new Error( 'paymentTypeID is not defined' ); }

    this.trip.seatID         = seatID         || this.trip.seatID;
    this.trip.categorySeatID = categorySeatID || this.trip.categorySeatID;
    this.trip.resident       = resident       || this.trip.resident;    

    const request = {
      Event_ID       : this.trip.eventID,
      TicketType_ID  : this.trip.ticketTypeID,
      Seat_ID        : this.trip.seatID,
      Category_ID    : this.trip.categorySeatID,
      PaymentType_ID : this.trip.paymentTypeID,
      Email          : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'GetSeatPrice', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._GetSeatPrice = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:GetSeatPriceResponse']['m:return']['d4p1:Price']['d4p1:StringJSON'] );

      return this;
    } )
  }
  
  // 11
  async _MenuOnTypePrice( typePriceID ) {
    this.trip.typePriceID = typePriceID || this.trip.typePriceID;
    if ( !this.trip.typePriceID ) { throw new Error( 'typePriceID is not defined' ); }

    const request = {
      TypePrice_ID : this.trip.typePriceID,
      Email        : this.email(),
    };

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'MenuOnTypePrice', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._MenuOnTypePrice = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:MenuOnTypePriceResponse']['m:return']['d4p1:Menu']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 12
  async _CheckPromoCode() { return await this; }

  // 13
  async _SaleSeat( order = [], orderID, sessionID, paymentTypeID, eventID ) {
    if ( !order.length ) { throw new Error( 'order is empty' ); }
 
    this.trip.eventID = eventID || this.trip.eventID;
    if ( !this.trip.eventID ) { throw new Error( 'eventID is not defined' ); }
 
    order = order.map( item => {
      return {
        SiteSeatID        : item.siteSeatID,
        TicketType_ID     : item.ticketTypeID,
        TypePrice_ID      : item.typePriceID,
        Seat_ID           : item.seatID,
        Category_ID       : item.categoryID,
        Menu_ID           : item.menuID,
        QuantityOfTickets : item.quantityOfTickets,
        Resident          : item.resident,
        Event_ID          : this.trip.eventID,
      }
    } );

    this.trip.orderID = orderID || this.trip.orderID;
    if ( !this.trip.orderID ) { throw new Error( 'orderID is not defined' ); }

    this.trip.sessionID = sessionID || this.trip.sessionID;
    if ( !this.trip.sessionID ) { throw new Error( 'sessionID is not defined' ); }

    this.trip.paymentTypeID = paymentTypeID || this.trip.paymentTypeID;
    if ( !this.trip.paymentTypeID ) { throw new Error( 'paymentTypeID is not defined' ); }


    const request = {
      Session_ID         : this.trip.sessionID,
      Order_ID           : this.trip.orderID,
      PaymentType_ID     : this.trip.paymentTypeID,
      PromoCode          : '',
      Card_ID            : '',
      GiftCertificate_ID : '',
      Order              : order,
      Email              : this.email(),
    };
    
    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'SaleSeat', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._SaleSeat = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:SaleSeatResponse']['m:return']['d4p1:Sale']['d4p1:StringJSON'] );

      return this;
    } );
  }

  // 14.1
  async _PaymentConfirmation( orderID ) {
    this.trip.orderID = orderID || this.trip.orderID;
    if ( !this.trip.orderID ) { throw new Error( 'orderID is not defined' ); }

    const request = {
      Order_ID     : this.trip.orderID,
      Confirmation : true,
      Email        : this.email(),
    };
    
    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'PaymentConfirmation', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._PaymentConfirmation = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:PaymentConfirmationResponse']['m:return']['d4p1:PaymentConfirm']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 14.2
  async _PaymentAbort( orderID ) {
    this.trip.orderID = orderID || this.trip.orderID;
    if ( !this.trip.orderID ) { throw new Error( 'orderID is not defined' ); }

    const request = {
      Order_ID     : this.trip.orderID,
      Confirmation : false,
      Email        : this.email(),
    };
    
    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'PaymentConfirmation', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._PaymentAbort = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:PaymentConfirmationResponse']['m:return']['d4p1:PaymentConfirm']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 15
  async _ChekDeposit( amount = 0 ) {
    const request = {
      AmountOrder : amount,
      Email       : this.email(),
    };
    
    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'ChekDeposit', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._ChekDeposit = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:ChekDepositResponse']['m:return']['d4p1:ChekDeposit']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 16
  async _GetDeposit( date ) {
    if ( !date ) { throw new Error( 'date is not defined' ); }

    const request = {
      Date  : date.toISOString(),
      Email : this.email(),
    };
    
    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'GetDeposit', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._GetDeposit = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:GetDepositResponse']['m:return']['d4p1:GetDeposit']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 17
  async _ReturnOrder( orderID, order = [] ) {
    this.trip.orderID = orderID || this.trip.orderID;
    if ( !this.trip.orderID ) { throw new Error( 'orderID is not defined' ); }

    const request = {
      Order_ID : this.trip.orderID,
      Email    : this.email(),
    };

    if ( !order.length ) {
      order = order.map( item => {
        return {
          SiteSeatID        : item.siteSeatID,
          TicketType_ID     : item.ticketTypeID,
          TypePrice_ID      : item.typePriceID,
          Seat_ID           : item.seatID,
          Category_ID       : item.categoryID,
          Menu_ID           : item.menuID,
          QuantityOfTickets : item.quantityOfTickets,
          Resident          : item.resident,
          Event_ID          : this.trip.eventID,
        }
      } );
    }

    return await api( {
      path     : this.path(),
      username : this.username(),
      password : this.password(),
      entity   : this._createRequest( 'ReturnOrder', request ),
    } ).then( response => {
      const jsonObj = fastXmlParser.parse( response.entity );
      this._ReturnOrder = JSON.parse( jsonObj['soap:Envelope']['soap:Body']['m:ReturnOrderResponse']['m:return']['d4p1:ReturnOrder']['d4p1:StringJSON'] );

      return this;
    } )
  }

  // 18
  async _GetDiscountCard() { return await this; }

  // 19
  async _GetInformationSource() { return await this; }

  // 20
  async _RegisterDiscountCard() { return await this; }

  // 21
  async _GetAmountCertificate() { return await this; }


}

module.exports = astraMarin;