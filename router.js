'use strict';

const UniversalRouter = require( 'universal-router' );
const astraMarin = require( './astraMarin' );

const {
  ASTRAMARIN_HOST: a_h,
  ASTRAMARIN_LOGIN: a_l,
  ASTRAMARIN_PASSWORD: a_p,
  ASTRAMARIN_EMAIL: a_e,
} = process.env;

const router = new UniversalRouter(
  {
    path: '',
    name: 'root',
    children: [
      {
        // Главная страница
        path: '',
        name: 'index',
        action: () => ({ version: '0.0.1' }),
      },
      {
        path: '/test',
        action: async () => {
          const api = new astraMarin( a_h, a_l, a_p, a_e );

          // 1
          await api._getServiceGroup();
          if ( !api._getServiceGroup.length ) { return api; }

          api.serviceGroupID = api._getServiceGroup[2].ServiceGroupID;

          // 2
          const dateFrom = new Date( 2018, 5, 10, 3, 0, 0 );
          const dateTo = new Date( 2018, 5, 30, 2, 59, 59, 999 );
          await api._servicesOnDate( dateFrom, dateTo );
          if ( !api._servicesOnDate.length ) { return api; }

          api.serviceID = api._servicesOnDate[0].ID;

          // 3
          const date = new Date( 2018, 6, 12, 3, 0, 0, 0 );
          await api._EventsOnDate( date );
          if ( !api._EventsOnDate.length ) { return api; }

          api.trip.selected = api._EventsOnDate[0];
          api.venueID = api.trip.selected.VenueID;
          api.eventID = api.trip.selected.ID;
          api.resident = api.trip.selected.StatusRequestBuyer;

          // 4
          await api._SeatСategory();
          if ( !api._SeatСategory.length ) { return api; }

          api.categorySeatID = api._SeatСategory[0].CategoryID;

          // 5
          await api._SeatsOnEvent();
          if ( !api._SeatsOnEvent.length ) { return api; }

          api.seatID = api._SeatsOnEvent[0].SeatID;
          api.sessionID = 'testNevaTrip_0001';

          if ( !api.trip.selected.NoSeat ) {
            // 6
            await api._BookingSeat();

            // 7
            await api._CancelBookingSeat();
          }

          // 8
          await api._GetTicketType();
          if ( !api._GetTicketType.length ) { return api; }

          api.ticketTypeID = api._GetTicketType[0].ID;

          // 9
          await api._GetPaymentType();
          if ( !api._GetPaymentType.length ) { return api; }

          api.paymentTypeID = api._GetPaymentType[1].PaymentID;

          // 10
          await api._GetSeatPrice();
          if ( !api._GetSeatPrice.length ) { return api; }

          api.typePriceID = api._GetSeatPrice[0].TypePriceID;

          // 11
          await api._MenuOnTypePrice( api._GetSeatPrice[0].TypePriceID );

          // 12
          // await api._CheckPromoCode();

          // 13
          api.orderID = 'NTR0000003';
          await api._SaleSeat( [
            {
              siteSeatID        : 'NTR0000002_1',
              ticketTypeID      : api.ticketTypeID,
              typePriceID       : api.typePriceID,
              seatID            : api.seatID,
              categoryID        : api._SeatСategory[0].CategoryID,
              menuID            : '',
              quantityOfTickets : 1,
              resident          : api.resident,
            },
            // {
            //   // siteSeatID        : 'NTR0000002_1',
            //   ticketTypeID      : api.ticketTypeID,
            //   typePriceID       : api._GetSeatPrice[1].TypePriceID,
            //   seatID            : api.seatID,
            //   categoryID        : api._SeatСategory[0].CategoryID,
            //   menuID            : '',
            //   quantityOfTickets : 0,
            //   resident          : api.resident,
            // },
            // {
            //   // siteSeatID        : 'NTR0000002_1',
            //   ticketTypeID      : api.ticketTypeID,
            //   typePriceID       : api._GetSeatPrice[2].TypePriceID,
            //   seatID            : api.seatID,
            //   categoryID        : api._SeatСategory[0].CategoryID,
            //   menuID            : '',
            //   quantityOfTickets : 0,
            //   resident          : api.resident,
            // },
          ] );

          // 14
          // await api._PaymentConfirmation();
          await api._PaymentAbort();

        /*
          // 15
          await api._ChekDeposit( 100 );

          // 16
          await api._GetDeposit( new Date() );

          // 17
          await api._ReturnOrder();
        */


          return api;
        }
      },

      {
        path: '*',
        name: '404',
        load: async () => await require( './routes/404' ),
      },
    ],

    async action( { next } ) {
      const route = ( await next() ) || {};
      return route;
    },
  },
  {
    resolveRoute( context, params ) {
      if ( typeof context.route.load === 'function' ) {
        return context.route.load().then( ( action ) => action( context, params ) );
      }
      if ( typeof context.route.action === 'function' ) {
        return context.route.action( context, params );
      }
      return undefined;
  },
} );

module.exports = router;

