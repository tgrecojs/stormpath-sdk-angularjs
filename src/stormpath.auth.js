'use strict';
/**
 * @ngdoc overview
 *
 * @name  stormpath.authService
 *
 * @description
 *
 * This module provides the {@link stormpath.authService.$auth $auth} service.
 *
 * Currently, this provider does not have any configuration methods.
 */
/**
 * @ngdoc object
 *
 * @name stormpath.authService.$authProvider
 *
 * @description
 *
 * Provides the {@link stormpath.authService.$auth $auth} service.
 *
 * Currently, this provider does not have any configuration methods.
 */
angular.module('stormpath.auth',['stormpath.CONFIG'])
.config(['$injector','STORMPATH_CONFIG',function $authProvider($injector,STORMPATH_CONFIG){
  /**
   * @ngdoc object
   *
   * @name stormpath.authService.$auth
   *
   * @description
   *
   * The auth service provides methods for authenticating a user, aka
   * "logging in" the user.
   */
  var authServiceProvider = {
    $get: ['$http','$user','$rootScope','$spFormEncoder','$q',function authServiceFactory($http,$user,$rootScope,$spFormEncoder,$q){

      function AuthService(){
        return this;
      }
      AuthService.prototype.authenticate = function authenticate(data) {
        /**
         * @ngdoc function
         *
         * @name  stormpath.authService.$auth#authenticate
         *
         * @methodOf stormpath.authService.$auth
         *
         * @param {Object} credentialData
         *
         * An object literal for passing username & password, or social provider
         * token.
         *
         * @returns {promise}
         *
         * A promise that is resolved with the authentication response or error
         * response (both are response objects from the $http service).
         *
         * @description
         *
         * Logs the user in.
         *
         * Sends the provided credential data to your backend server. The server
         * handler should verify the credentials and return an access token,
         * which is stored in an HTTP-only cookie.
         *
         * @example
         *
         * ## Username & Password example
         *
         * <pre>
         * myApp.controller('LoginCtrl', function ($scope, $auth, $state) {
         *   $scope.errorMessage = null;
         *   $scope.formData = {
         *     username: '',         // Expose to user as email/username field
         *     password: '',
         *   };
         *
         *   // Use this method with ng-submit on your form
         *   $scope.login = function login(formData){
         *     $auth.authenticate(formData)
         *      .then(function(){
         *        console.log('login success');
         *        $state.go('home');
         *      })
         *      .catch(function(httpResponse){
         *        $scope.errorMessage = response.data.message;
         *      });
         *   }
         *
         * });
         * </pre>
         */
        var op = $http($spFormEncoder.formPost({
            url: STORMPATH_CONFIG.getUrl('AUTHENTICATION_ENDPOINT'),
            method: 'POST',
            withCredentials: true,
            data: data,
            params: {
              'grant_type': 'password'
            }
          })
        );
        var op2 = op.then(cacheCurrentUser).then(authenticatedEvent);
        op.catch(authenticationFailureEvent);
        return op2;

      };
      /**
       * @ngdoc function
       *
       * @name  stormpath.authService.$auth#endSession
       *
       * @methodOf stormpath.authService.$auth
       *
       * @returns {promise}
       *
       * A promise that is resolved if logout is successful, or rjected with
       * an $http error response if there was an error.
       *
       * @description
       *
       * Log out the user.
       *
       * Makes an HTTP reuest to
       * {@link api/stormpath.STORMPATH_CONFIG:STORMPATH_CONFIG#properties_destroy_session_endpoint DESTROY_SESSION_ENDPOINT}
       *
       * This method is called when you click an element that has the
       * {@link stormpath.spLogout:spLogout spLogout} directive on it.
       *
       * @example
       *
       * <pre>
       * myApp.controller('LogoutController', function ($scope, $auth, $state) {
       *   $scope.logout = function login(formData){
       *     $auth.endSession(formData)
       *      .then(function(){
       *        console.log('you have logged out');
       *        $state.go('home');
       *      })
       *      .catch(function(httpResponse){
       *        console.log('there was a problem with the logout request');
       *      });
       *   }
       *
       * });
       * </pre>
       */
      AuthService.prototype.endSession = function endSession(){
        var op = $q.defer();
        $http.get(STORMPATH_CONFIG.getUrl('DESTROY_SESSION_ENDPOINT')).then(function(){
          $rootScope.$broadcast(STORMPATH_CONFIG.SESSION_END_EVENT);
          op.resolve();
        },op.reject);
        return op.promise;
      };

      function cacheCurrentUser(){
        return $user.get();
      }

      function authenticatedEvent(response){
        /**
         * @ngdoc event
         *
         * @name stormpath.authService.$auth#$authenticated
         *
         * @eventOf stormpath.authService.$auth
         *
         * @eventType broadcast on root scope
         *
         * @param {Object} event
         *
         * Angular event object.
         *
         * @param {httpResponse} httpResponse
         *
         * The http response from the $http service.  If you are writing your access tokens to the response body
         * when a user authenticates, you will want to use this response object to get access to that token.
         *
         * @description
         *
         * This event is broadcast when a call to
         * {@link stormpath.authService.$auth#methods_authenticate $auth.authenticate()}
         * is successful.
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME,response);
      }
      function authenticationFailureEvent(response){
        $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_FAILURE_EVENT_NAME,response);
      }
      return new AuthService();
    }]
  };

  $injector.get('$provide')
    .provider(STORMPATH_CONFIG.AUTH_SERVICE_NAME,authServiceProvider);

}]);
