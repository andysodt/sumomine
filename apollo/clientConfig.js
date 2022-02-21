import { InMemoryCache } from "apollo-cache-inmemory";
export default function(context){
  return {
  		httpLinkOptions: {
    		uri: 'https://sumo.sumomine.com/v1/graphql',
    		credentials: 'same-origin'
  		},
  		cache: new InMemoryCache(),
	    wsEndpoint: 'wss://sumo.sumomine.com/v1/graphql',
  	}
}