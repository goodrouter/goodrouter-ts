# Good Router
![status](https://travis-ci.org/LuvDaSun/goodrouter.svg?branch=master)

A good router should:
 - [x] work in a server or a client (or any other) environment
 - [ ] support named routes, and also construct routes from names and parameters
 - [x] have async enter, leave and change hooks
 - [x] have support for parent / child routes
 - [x] not do the actual navigation!
 - [x] be framework agnostic


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



