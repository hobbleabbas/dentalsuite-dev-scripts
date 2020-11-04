var App = {
  user: null,

  signup: function(data) {
    let email = $('#signupEmail').val();
    let password = $('#signupPassword').val();

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(function() {
        // take to profile page?
      })
      .catch(function(error) {

      });
  },
  signin: function(data) {},
  signinGoogle: function() {},
  signout: function() {
    firebase.auth().signOut();
  },

  putInStorage: function(uid, file) {},
  getFromStorage: function(uid, what) {},

  putInDatabase: function(uid, data) {},
  getFromDatabase: function(uid, list) {},

  setAuthStateListener: function() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        this.user = user;
      } else {
        this.user = null;
      }
    });
  },

  bindElements: function() {},
  bindEventListeners: function() {},
  bindEventHandlers: function() {},
  init: function() {
    this.setAuthStateListener();
    this.bindElements();
    this.bindEventListeners();
    this.bindEventHandlers();
  },
};

$(function() {
  App.init();
});