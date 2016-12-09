(function() {
    var app = angular.module('app', ['ngRoute', 'angular-jwt']);

    app.run(function($http, $location, $window, $rootScope) {

        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.localStorage.token;

        $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
            if(nextRoute.access !== undefined && nextRoute.access.restricted === true && !$window.localStorage.token) {
                event.preventDefault();
                $location.path('/');
            }
            if($window.localStorage.token && nextRoute.access.restricted === true) {
                $http.post('/api/verify-token', { token: $window.localStorage.token })
                     .then(function(response) {
                         console.log(response);
                         console.log('Token is valid. May continue');
                     }, function(err) {
                         console.log('err has occured');
                         delete $window.localStorage.token;
                         $location.path('/login');
                     })
            }
        })
    })

    app.config(function($locationProvider, $routeProvider) {

        $locationProvider.html5Mode(true);

        $routeProvider.when('/', {
            templateUrl: './templates/main.html',
            controller: 'MainController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/register', {
            templateUrl: './templates/register.html',
            controller: 'RegisterController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/login', {
            templateUrl: './templates/login.html',
            controller: 'LoginController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/profile', {
            templateUrl: './templates/profile.html',
            controller: 'ProfileController',
            controllerAs: 'vm',
            access: {
                restricted: true
            }
        });
        $routeProvider.when('/books', {
            templateUrl: './templates/books.html',
            controller: 'BooksController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/books/:id', {
            templateUrl: './templates/book.html',
            controller: 'BookController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        })

        $routeProvider.otherwise('/');

    });

    app.controller('MainController', MainController);

    function MainController() {
        var vm = this;
        vm.title = "MainController";
    }

    app.controller('BookController', BookController);

    function BookController($http, $location, $window, $routeParams) {
        var vm = this;
        vm.title = "BookController";
        var id = $routeParams.id;
        vm.book = {};
        $http.get('/api/books/' + id)
             .then(function(response) {
                 vm.book = response.data
             }, function(err) {
                 console.log(err)
             })
    }


    app.controller('BooksController', BooksController);

    function BooksController($http, $location, $window, jwtHelper) {
        var vm = this;
        vm.title = "BooksController";
        vm.books = [];
        vm.error = '';
        vm.cover = '';
        vm.loading = false;
        var owner = jwtHelper.decodeToken($window.localStorage.token).data.name || null;
        vm.addBook = function() {
            if(vm.book.title) {
                console.log(vm.book.title);
                $http.post('/api/books/search', { title: vm.book.title, owner: owner })
                     .then(function(response) {
                         vm.loading = true;
                         vm.book.title = '';
                         vm.getAllBooks();
                         $location.path('/books/' + response.data._id)
                         
                     }, function(err) {
                         console.log(err)
                         vm.error = err.data;
                     })
            } 
        }

        vm.getAllBooks = function() {
            $http.get('/api/books').then(function(response) {
                console.log(response);
                vm.books = response.data
                vm.loading = false;
            }, function(err) {
                console.log(err);
                vm.error = 'No books here yet!'
            })
        }

        vm.getAllBooks();


    }

    app.controller('ProfileController', ProfileController);

    function ProfileController($http, jwtHelper, $window, $location) {
        var vm = this;
        vm.title = "ProfileController";
        vm.books = [];
        var tokenData = jwtHelper.decodeToken($window.localStorage.token).data;
        vm.currentUser = tokenData;

        vm.logout = function() {
            vm.currentUser = null;
            delete $window.localStorage.token;
            $location.path('/login');
        }

        vm.getUserBooks = function() {
            
            $http.get('/api/books/byUser/' + tokenData.name)
                 .then(function(response) {
                     console.log(response);
                     vm.books = response.data
                 }, function(err) {
                     console.log(err)
                 })
        }
        if(tokenData !== null) {
             vm.getUserBooks();
        }
       
    }

    app.controller('LoginController', LoginController);

    function LoginController($http, $location, $window) {
        var vm = this;
        vm.title = "LoginController";
        vm.error = '';
        vm.login = function() {
            if(vm.user) {
                $http.post('/api/login', vm.user)
                     .then(function(response) {
                         console.log(response);
                         $window.localStorage.token = response.data;
                         $location.path('/profile');
                     }, function(err) {
                         console.log(err);
                         vm.error = err;
                     })
            }
            else {
                vm.error = 'Please provide valid credentials!'
            }
        }

    }

    app.controller('RegisterController', RegisterController);

    function RegisterController($http, $location, $window) {
        var vm = this;
        vm.title = "RegisterController";
        vm.error = '';
        vm.register = function() {
            if(vm.user) {
                $http.post('/api/register', vm.user)
                     .then(function(response) {
                         console.log(response);
                         $window.localStorage.token = response.data;
                         $location.path('/profile');
                     }, function(error) {
                         vm.error = error;
                         vm.user = {};
                     })
            }
            else {
                vm.error = 'Please enter valid credentials!'
            }
        }

    }

}())