import { InMemoryCache } from "apollo-cache-inmemory";
export default function(context){
  return {
  		httpLinkOptions: {
    		uri: 'http://198.199.93.139/v1/graphql',
    		credentials: 'same-origin'
  		},
  		cache: new InMemoryCache(),
	    wsEndpoint: 'ws://198.199.93.139/v1/graphql',
  	}
}