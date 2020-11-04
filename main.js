let App = {
  user: null,

  signup: function(data) {
    firebase.auth().createUserWithEmailAndPassword(data.email, data.password)
      .then(function() {})
      .catch(function(error) {});
  },
  signin: function(data) {
    firebase.auth().signInWithEmailAndPassword(data.email, data.password)
      .then(function() {})
      .catch(function(error) {});
  },
  signinGoogle: function() {},
  signout: function() {
    firebase.auth().signOut();
  },

  putInStorage: function(uid, file) {},
  getFromStorage: function(uid, list) {},

  putInDatabase: function(uid, data) {},
  getFromDatabase: function(uid, list) {},

  setAuthStateListener: function() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        this.user = user;
        redirect('profile/user-profile');
        if (user.photoURL) {
          this.toggleNavUserLoggedInWithPhoto();
        } else {
          this.toggleNavUserLoggedInWithoutPhoto();
        }
      } else {
        this.user = null;
        this.authGuardProfile();
        this.toggleNavUserLoggedOut();
      }
    }.bind(this));
  },
  authGuardProfile: function() {
    if (location.pathname.includes('profile') && !this.user) {
      redirect('/');
    }
  },
  toggleNavUserLoggedInWithPhoto: function() {
    this.$loginButton.toggle(false);
    // set pic in profile avatar button
    this.$profileAvatarButton.toggle(true);
    this.$profileNameButton.toggle(false);
  },
  toggleNavUserLoggedInWithoutPhoto: function() {
    this.$loginButton.toggle(false);
    // set name in profile name button
    this.$profileAvatarButton.toggle(false);
    this.$profileNameButton.toggle(true);
  },
  toggleNavUserLoggedOut: function() {
    // remove photourl and user first name from elements
    this.$profileAvatarButton.toggle(false);
    this.$profileNameButton.toggle(false);
    this.$loginButton.toggle(true);
  },

  bindElements: function() {
    this.$loginButton = $('#login-button');
    this.$profileAvatarButton = $('#profile-avatar-button');
    this.$profileNameButton = $('#profile-name-button')
  },
  bindEventListeners: function() {

  },

  handleSignup: function(event) {
    event.preventDefault();

    let data = {
      email: $('#signupEmail').val(),
      password: $('#signupPassword').val(),
    };

    this.signup(data);
  },

  init: function() {
    this.bindElements();
    this.bindEventListeners();
    this.setAuthStateListener();
    return this;
  },
};

$(function() {
  App.init();
});

function redirect(path) {
  if (location.pathname !== path) {
    location.pathname = path;
  }
}