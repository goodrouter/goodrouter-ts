# Good Router

A good router should:
 - work in a server or a client (or any other) environment
 - support named routes, and also construct routes from names and parameters
 - have async enter, leave and change hooks
 - have support for parent / child routes
 - not do the actual navigation!
 - be framework agnostic


## Route lifecycle

Route lifecycle


### isLeavingRoute

parent → child


### routeIsChanging

parent → child


### isEnteringRoute

parent → child


### render

child → parent


### hasEnteredRoute

child → parent


### routeHasChanged

child → parent


### hasLeftRoute

child → parent



