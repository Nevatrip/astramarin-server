const fs = require( 'fs' );
const path = require( 'path' );
const app = require( 'express' )();
const PrettyError = require( 'pretty-error' );
const router = require( './router' );
const port = process.env.PORT;
const isSocket = isNaN( port );
const __DEV__ = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() !== 'production';
const _next = ( req, res, next ) => next();

if ( __DEV__ ) {
  require( 'debug-http' )();
}

app
  .disable( 'x-powered-by' )
  .enable( 'trust proxy' )
  .use( require( 'compression' )() )
  .use( require( 'body-parser' ).urlencoded( { extended: true } ) )
  .use(
    __DEV__
      ? require( 'express-pino-logger' )( {
          extreme: true,
          level: process.env.LOG_LEVEL.toLowerCase(),
        } )
      : _next,
  )
  .use( __DEV__ ? _next : require( 'connect-slashes' )() );

app.all( '*', async ( req, res, next ) => {
  try {
    console.time( 'Route' );
    const route = await router.resolve( {
      pathname: req.path,
      query: req.query || {},
      body: req.body || {},
      session: req.session,
    } );
    console.timeEnd( 'Route' );

    if ( route.redirect ) {
      res.redirect( route.status || 302, route.redirect );
      return;
    }

    res.status( route.status || 200 );

    return res.json( route );
  } catch ( error ) {
    next( error );
  }
} );

//
// Error handling
// ----------------------------------------------------------------------------
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage( 'express' );

// eslint-disable-next-line no-unused-vars
app.use( ( err, req, res, next ) => {
  console.error( pe.render( err ) );
  res.status( err.status || 500 );
  return res.json( { error: err } );
} );

isSocket && fs.existsSync( port ) && fs.unlinkSync( port );
app.listen( port, function() {
  isSocket && fs.chmod( port, '0777' );
  console.log( 'Server is listening on', this.address().port );
} );
