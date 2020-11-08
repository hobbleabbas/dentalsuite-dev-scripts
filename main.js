FLASH_MESSAGE_DELAY = 3000;
LOADING_SCREEN_DELAY = 500;

let App = {
  user: null,

  signup: function(data) {
    firebase.auth().createUserWithEmailAndPassword(data.email, data.password)
      .then(redirectToProfile)
      .catch(this.displayError.bind(this));
  },
  signin: function(data) {
    firebase.auth().signInWithEmailAndPassword(data.email, data.password)
      .then(redirectToProfile)
      .catch(this.displayError.bind(this));
  },
  signinGoogle: function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(function(result) {
        this.user = result.user;
        this.addDisplayNameAndPhotoUrlToDatabase(this.user);
        redirectToProfile();
      }.bind(this)).catch(this.displayError.bind(this));
  },
  addDisplayNameAndPhotoUrlToDatabase: function(user) {
    if (user.displayName) {
      let names = user.displayName.split(' ');
      let firstName = names[0];
      let lastName = names.slice(1).join(' ');
      user.putDataInDatabase({
        'first-name': firstName,
        'last-name': lastName,
        photoURL: user.photoURL
      });
    }
  },
  signout: function() {
    firebase.auth().signOut();
    redirectToHome();
  },
  displayError: function(error) {
    this.$success.toggle(false);
    this.$error.text(error.message).toggle(true);
  },

  updateProfile: function(data) {
    this.user.updateProfile(data)
      .then(this.updateUser.bind(this))
      .catch(logError);
  },
  resetProfileAfterUpdate: function(data) {
    this.$success.toggle(false);
    this.$editProfileForm.toggle(true);
    window.scrollTo(0, 0);
    this.updateUserDataLocal(data);
    this.loadPageData();
  },
  updateUserDataLocal: function(data) {
    Object.keys(data).forEach(function(key) {
      let value = data[key];
      this.userData[key] = value;
    }.bind(this));
  },
  updateuser: function() {
    this.user = firebase.auth().currentUser;
  },

  putFileInStorage: function(file) {
    let storageRef = firebase.storage().ref();
    let path = `avatars/${this.user.uid}`;
    let avatarRef = storageRef.child(path);
    avatarRef.put(file).then(function(snapshot) {
      avatarRef.getDownloadURL().then(function(url) {
        this.putDataInDatabase({photoURL: url});
      }.bind(this)).catch(logError);
    }.bind(this)).catch(logError);
  },
  putDataInDatabase: function(data) {
    let dbRef = firebase.database().ref('users/' + this.user.uid);
    dbRef.set(data, function(error) {
      if (error) {
        logError(error);
      } else {
        setTimeout(function() {
          this.resetProfileAfterUpdate(data);
        }.bind(this), FLASH_MESSAGE_DELAY);
      }
    }.bind(this));
  },
  getDataFromDatabase: function() {
    let dbRef = firebase.database().ref('users/' + this.user.uid);
    dbRef.once('value').then(function(snapshot) {
      this.userData = snapshot.val() || {};
      this.loadPageData();
    }.bind(this)).catch(logError);
  },

  setAuthStateListener: function() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        this.user = user;
        if (user.photoURL) {
          this.toggleNavUserLoggedInWithPhoto();
        } else {
          this.toggleNavUserLoggedInWithoutPhoto();
        }
        this.getDataFromDatabase();
      } else {
        this.user = null;
        this.authGuardProfile();
        this.toggleNavUserLoggedOut();
      }
    }.bind(this));
  },
  hideLoadingScreen: function() {
    this.$loadingScreenTop.animate({top: -window.innerHeight}, LOADING_SCREEN_DELAY)
        .toggle(false);
    this.$loadingScreenBottom.animate({top: window.innerHeight}, LOADING_SCREEN_DELAY)
        .toggle(false);
  },
  authGuardProfile: function() {
    if (this.isProfilePage() && !this.user) {
      redirect('/');
    }
  },
  toggleNavUserLoggedInWithPhoto: function() {
    this.$loginButton.toggle(false);
    this.setProfileNavAvatar();
    this.$profileAvatarNameSection.toggle(true);
  },
  toggleNavUserLoggedInWithoutPhoto: function() {
    this.$loginButton.toggle(false);
    this.setProfileNavAvatar();
    this.$profileAvatarNameSection.toggle(true);
  },
  toggleNavUserLoggedOut: function() {
    this.setProfileNavAvatar();
    this.$profileNameButton.text('User Name');
    this.$profileAvatarNameSection.toggle(false);
    this.$loginButton.toggle(true);
  },
  setProfileNavAvatar: function() {
    let data = this.userData;
    let url = (data && data.photoURL) || DEFAULT_PROFILE_PHOTO_URL;
    let attribute = {style: `background-image: url(${url})`};
    this.$profileAvatarButton.attr(attribute);
  },
  setProfileHeaderAvatar: function() {
    let data = this.userData;
    let url = (data && data.photoURL) || DEFAULT_PROFILE_PHOTO_URL;
    this.$userAvatar.attr('src', url);
  },
  setProfileNavName: function() {
    this.$profileNameButton.text(this.userData['first-name'] || this.user.email);
  },

  loadPageData: function() {
    this.loadAvatars();
    this.setProfileNavName();
    if (location.pathname === "/profile/user-profile") {
      this.loadProfileHeader();
      this.loadProfileAbout();
      this.loadProfileEdit();
      this.hideLoadingScreen();
    }
  },
  loadProfileHeader: function() {
    let data = this.userData;
    let firstName = data['first-name'] || '';
    let lastName = data['last-name'] || '';
    let displayName = (firstName + ' ' + lastName).trim();
    let headerText = displayName ? `Hello there, ${displayName}` : 'Hello there!';
    this.$welcomeHeading.text(headerText);
    let photoURL = data.photoURL || DEFAULT_PROFILE_PHOTO_URL;
    this.$userAvatar.attr('src', photoURL);
    this.$usernameHeader.text(displayName);
  },
  loadProfileAbout: function() {
    let data = this.userData;
    Object.keys(this.userData).forEach(function(key) {
      let value = data[key];
      let element = document.getElementById('about-' + key);
      if (element && value) {
        element.textContent = value;
      }
    });
  },
  loadProfileEdit: function() {
    // TODO reset form and clear file upload?
    let data = this.userData;
    Object.keys(data).forEach(function(key) {
      let value = data[key];
      let element = document.getElementById('edit-' + key);
      if (element && value) {
        element.value = value;
      }
    });
  },
  loadAvatars: function() {
    this.setProfileNavAvatar(this.userData.photoURL);
    this.setProfileHeaderAvatar(this.userData.photoURL);
  },

  bindElements: function() {
    // nav
    this.$loginButton = $('#login-button');
    this.$profileAvatarButton = $('#profile-avatar-button');
    this.$profileNameButton = $('#profile-name-button');
    this.$profileAvatarNameSection = $('#profile-avatar-and-name');

    // signup/signin general
    this.$formError = $('#form-error-message').toggle(false);

    // generic
    this.$error = $('.error-message');
    this.$success = $('.success-message');

    // sign up
    this.signupForm = document.getElementById('signupForm');
    this.$signupAgreeToTermsCheckbox = $('#sigupCheckbox');

    // sign in
    this.signinForm = document.getElementById('signinForm');
    this.$signinGoogleButton = $('#signin-google-button');
    this.$signinRememberMeCheckbox = $('#signinCheckbox');
    this.$forgotPasswordLink = $('#forgotPasswordLink');

    // profile general
    this.$welcomeHeading = $('#welcome-heading');
    this.$backgroundHeaderImage = $('#background-header-image');
    this.$editBackgroundImageButton =$('#edit-background-image');
    this.$userAvatar = $('#user-avatar');
    this.$usernameHeader = $('#username-header');
    this.$loadingScreenTop = $('#loading-screen-top');
    this.$loadingScreenBottom = $('#loading-screen-bottom');

    // profile about
    this.$aboutPhone = $('#about-phone');
    this.$aboutBirthdate = $('#about-birthdate');
    this.$aboutContactEmail = $('#about-contact-email');
    this.$aboutLocation = $('#about-location');
    this.$aboutPosition = $('#about-position');
    this.$aboutBio = $('#about-bio');

    // profile edit
    this.$editProfileForm = $('#wf-form-profile');
    this.$editPhotoUpload = $('#photo-upload');
    this.$editFirstName = $('#edit-first-name');
    this.$editLastName = $('#edit-last-name');
    this.$editBirthdateDay = $('#edit-birthdate-day');
    this.$editBirthdateMonth = $('#edit-birthdate-month');
    this.$editBirthdateYear = $('#edit-birthdate-year');
    this.$editLocation = $('#edit-location');
    this.$editContactEmail = $('#edit-contact-email');
    this.$editPhone = $('#edit-phone');
    this.$editFacebookUrl = $('#edit-facebook-url');
    this.$editInstagramUrl = $('#edit-instagram-url');
    this.$editTwitterUrl = $('#edit-twitter-url');
    this.$editBio = $('#edit-bio');

    this.$signoutButton = $('.link-logout');
  },
  bindEventListeners: function() {
    if (this.isSignupPage()) {
      this.signupForm.addEventListener('submit', this.handleSignup.bind(this), true);
    } else if (this.isSigninPage()) {
      this.signinForm.addEventListener('submit', this.handleSignin.bind(this), true);
    }
    this.$signinGoogleButton.click(this.handleGoogleSignin.bind(this));
    this.$editProfileForm.submit(this.handleProfileEdit.bind(this));
    this.$signoutButton.click(this.handleSignout.bind(this));
  },
  isProfilePage: function() {
    return location.pathname.includes('profile');
  },
  isSigninPage: function() {
    return !!this.signinForm;
  },
  isSignupPage: function() {
    return !!this.signupForm;
  },

  handleSignout: function(event) {
    event.preventDefault();
    this.signout();
  },
  handleSignup: function(event) {
    event.preventDefault();
    event.stopPropagation();
    let data = {
      email: $('#email').val(),
      password: $('#password').val(),
    };
    this.signup(data);
  },
  handleSignin: function(event) {
    event.preventDefault();
    event.stopPropagation();
    let data = {
      email: $('#email').val(),
      password: $('#password').val(),
    };
    this.signin(data);
  },
  handleGoogleSignin: function(event) {
    event.preventDefault();
    this.signinGoogle();
  },
  handleProfileEdit: function(event) {
    event.preventDefault();
    let form = event.currentTarget;
    let data = getFormData(form);
    this.extractAndProcessPhotoFromFormData(data);
    this.putDataInDatabase(data);
  },
  extractAndProcessPhotoFromFormData: function(data) {
    if (data['photo-upload'].name) {
      let file = data['photo-upload'];
      this.putFileInStorage(file);
      delete data['photo-upload'];
    }
  },

  init: function() {
    this.bindElements();
    this.bindEventListeners();
    this.setAuthStateListener();
    return this;
  },
};

$(function() {
  window.app = App.init(); // development
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

function log(message) {
  console.log(message);
}

function logError(error) {
  if (error.code && error.message) {
    console.error('Error code: ' + error.code);
    console.error('Error message: ' + error.message);
  } else {
    console.error(error);
  }
}

function getFormData(form) {
  let formData = new FormData(form);
  let data = {};
  for (var pair of formData.entries()) {
    let key = pair[0],
        value = pair[1];
    data[key] = value;
  }
  return data;
}