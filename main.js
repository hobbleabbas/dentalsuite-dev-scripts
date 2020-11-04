let App = {
  user: null,

  userFirstName: function() {
    let displayName = this.user.displayName
    if (displayName) {
      return displayName.split(' ')[0];
    }
  },
  userEmail: function() {
    return this.user.email;
  },

  signup: function(data) {
    firebase.auth().createUserWithEmailAndPassword(data.email, data.password)
      .then(redirectToProfile)
      .catch(logError);
  },
  signin: function(data) {
    firebase.auth().signInWithEmailAndPassword(data.email, data.password)
      .then(redirectToProfile)
      .catch(logError);
  },
  signinGoogle: function() {},
  signout: function() {
    firebase.auth().signOut();
    redirectToHome();
  },

  putFileInStorage: function(uid, file) {},
  getFileFromStorage: function(uid, list) {},

  putDataInDatabase: function(uid, data) {},
  getDataFromDatabase: function(uid, list) {},

  setAuthStateListener: function() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        this.user = user;
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
    this.$profileNameButton.text(this.userFirstName() || this.userEmail());
    this.$profileAvatarNameSection.toggle(true);
  },
  toggleNavUserLoggedInWithoutPhoto: function() {
    this.$loginButton.toggle(false);
    // load a default placeholder photo as avatar
    this.$profileNameButton.text(this.userFirstName() || this.userEmail());
    this.$profileAvatarNameSection.toggle(true);
  },
  toggleNavUserLoggedOut: function() {
    // remove photourl and user first name from elements
    this.$profileNameButton.text('');
    this.$profileAvatarNameSection.toggle(false);
    this.$loginButton.toggle(true);
  },

  bindElements: function() {
    // nav
    this.$loginButton = $('#login-button');
    this.$profileAvatarButton = $('#profile-avatar-button');
    this.$profileNameButton = $('#profile-name-button');
    this.$profileAvatarNameSection = $('#profile-avatar-and-name');

    // sign up
    this.$signupForm = $('#signupForm');
    this.$signupEmail = $('#signupEmail');
    this.$signupPassword = $('#signupPassword');
    this.$signupAgreeToTermsCheckbox = $('#sigupCheckbox');

    // sign in
    this.$signinForm = $('#signinForm');
    this.$signinGoogleButton = $('#signin-google-button');
    this.$signinEmail = $('#signinEmail');
    this.$signinPassword = $('#signinPassword');
    this.$signinRememberMeCheckbox = $('#signinCheckbox');
    this.$forgotPasswordLink = $('#forgotPasswordLink');

    // profile general
    this.$usernameWelcome = $('#username-welcome');
    this.$backgroundHeaderImage = $('#background-header-image');
    this.$userAvatar = $('#user-avatar');
    this.$usernameHeader = $('#username-header');

    // profile about
    this.$aboutPhone = $('#about-phone');
    this.$aboutBirthdate = $('#about-birthdate');
    this.$aboutContactEmail = $('#about-contact-email');
    this.$aboutLocation = $('#about-location');
    this.$aboutPosition = $('#about-position');
    this.$aboutBio = $('#about-bio');

    // profile edit
    this.$editProfileForm = $('wf-form-profile');
    this.$editPhotoUpload = $('#edit-photo-upload');
    this.$editFirstName = $('#edit-first-name');
    this.$editLastName = $('#edit-last-name');
    this.$editBirthdateDay = $('#edit-birthdate-day');
    this.$editBirthdateMonth = $('#edit-birthdate-month');
    this.$editBirthdateYear = $('#edit-birthdate-year');
    this.$editLocation = $('#edit-location');
    this.$editContactEmail = $('#edit-contact-email');
    this.$editPhone = $('#edit-phone');
    this.$editFacebookLink = $('#edit-facebook-link');
    this.$editInstagramLink = $('#edit-instagram-link');
    this.$editTwitterLink = $('#edit-twitter-link');
    this.$editBio = $('#edit-bio');
  },
  bindEventListeners: function() {
    this.$signupForm.submit(this.handleSignup.bind(this));
    this.$signinForm.submit(this.handleSignin.bind(this));
    // this.$editProfileForm.submit(this.handleProfileEdit.bind(this));
  },

  handleSignup: function(event) {
    event.preventDefault();
    event.stopPropagation();
    let data = {
      email: $('#signupEmail').val(),
      password: $('#signupPassword').val(),
    };
    this.signup(data);
  },
  handleSignin: function(event) {
    event.preventDefault();
    event.stopPropagation();
    let data = {
      email: $('#signinEmail').val(),
      password: $('#signinPassword').val(),
    };
    this.signin(data);
  },
  // handleProfileEdit: function(event) {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   let data = getEditProfileData();
    
  // },

  init: function() {
    this.bindElements();
    this.bindEventListeners();
    this.setAuthStateListener();
    return this;
  },
};

$(function() {
  window.app = App.init(); // just for development
  // App.init();  // production
});

function redirect(path) {
  if (location.pathname !== path) {
    console.log('redirecting from ' + location.pathname + ' to ' + path);
    location.pathname = path;
  }
}

function redirectToHome() {
  redirect('/');
}

function redirectToProfile() {
  redirect('profile/user-profile');
}

function logError(error) {
  console.error('Error code: ' + error.code);
  console.error('Error message: ' + error.message);
}