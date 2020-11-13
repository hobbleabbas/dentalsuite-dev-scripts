SUCCESS_MESSAGE_DELAY = 3000;
LOADING_SCREEN_DELAY = 500;
LOGGING_ENABLED = true;

let App = {
  user: null,

  signup: function(data) {
    firebase.auth().createUserWithEmailAndPassword(data.email, data.password)
      // .then(redirectToProfile)
      .catch(this.displayError.bind(this));
  },
  signin: function(data) {
    firebase.auth().signInWithEmailAndPassword(data.email, data.password)
      // .then(redirectToProfile)
      .catch(this.displayError.bind(this));
  },
  signinGoogle: function() {
    log('Signing user in with Google Auth provider.')
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(function(result) {
        this.user = result.user;
        // this.addDisplayNameAndPhotoUrlToDatabase();
        // redirectToProfile();
      }.bind(this)).catch(this.displayError.bind(this));
  },
  // addDisplayNameAndPhotoUrlToDatabase: function() {
  //   let user = this.user;
  //   if (user.displayName) {
  //     let names = user.displayName.split(' ');
  //     let firstName = names[0];
  //     let lastName = names.slice(1).join(' ');
  //     log('Adding displayName and photoURL to database.');
  //     this.putDataInDatabase({
  //       'first-name': firstName,
  //       'last-name': lastName,
  //       photoURL: user.photoURL
  //     });
  //   }
  // },
  signout: function() {
    firebase.auth().signOut();
    redirectToHome();
  },
  displayError: function(error) {
    this.$success.toggle(false);
    this.$error.text(error.message || error).toggle(true);
  },
  displaySuccess: function(message) {
    this.$error.toggle(false);
    this.$success.text(message).toggle(true);
  },
  isProfilePage: function() {
    return (location.pathname === "/profile/user-profile");
  },
  isAccountSettingsPage: function() {
    return (location.pathname === "/profile/account-settings/account-settings");
  },
  isSigninPage: function() {
    return !!this.signinForm;
  },
  isSignupPage: function() {
    return !!this.signupForm;
  },

  updateUserDataLocal: function(data) {
    log('Adding the following to user\'s local data store...');
    log(data);
    Object.keys(data).forEach(function(key) {
      let value = data[key];
      this.userData[key] = value;
    }.bind(this));
    this.loadPageData();
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
    this.updateUserDataLocal(data);
    let dbRef = firebase.database().ref('users/' + this.user.uid);
    log('Adding the following to database...');
    log(data);
    dbRef.set(this.userData, function(error) {
      if (error) {
        logError(error);
      } else {
        setTimeout(function() {
          location.reload();
          timeout = undefined;
        }.bind(this), SUCCESS_MESSAGE_DELAY);
      }
    }.bind(this));
  },
  getDataFromDatabaseAndLoadPageData: function() {
    let dbRef = firebase.database().ref('users/' + this.user.uid);
    dbRef.once('value').then(function(snapshot) {
      this.userData = snapshot.val() || {};
      this.pullDisplayNameAndPhotoUrlFromGoogleSignin();
      this.loadPageData();
    }.bind(this)).catch(logError);
  },

  pullDisplayNameAndPhotoUrlFromGoogleSignin() {
    let data = this.userData,
        user = this.user;
    if (!data.firstName && !data.lastName) {
      let names = user.displayName.split(' ');
      data.firstName = names.shift();
      data.lastName = names.join(' ');
    }
    if (!data.photoURL) {
      data.photoURL = user.photoURL;
    }
  },

  setAuthStateListener: function() {
    firebase.auth().onAuthStateChanged(function(user) {
      this.user = user;
      if (user) {
        this.toggleNavWhenUserLoggedIn();
        this.getDataFromDatabaseAndLoadPageData();
      } else {
        this.toggleNavWhenUserLoggedOut();
      }
    }.bind(this));
  },
  hideLoadingScreen: function() {
    window.scrollTo(0, 0);
    this.$loadingScreenTop.animate(
      {top: -window.innerHeight},
      LOADING_SCREEN_DELAY,
      function() {
        this.$loadingScreenTop.toggle(false);
      }.bind(this)
    );
    this.$loadingScreenBottom.animate(
      {top: window.innerHeight},
      LOADING_SCREEN_DELAY,
      function() {
        this.$loadingScreenBottom.toggle(false);
      }.bind(this)
    );
  },
  authGuard: function() {
    if ((this.isSigninPage() || this.isSignupPage()) && this.user) {
      redirectToProfile();
    } else if (this.isProfilePage() && !this.user) {
      redirectToHome();
    }
  },
  toggleNavWhenUserLoggedIn: function() {
    this.$loginButton.toggle(false);
    this.setProfileNavAvatar();
    this.$profileAvatarNameSection.toggle(true);
  },
  toggleNavWhenUserLoggedOut: function() {
    this.$profileNameButton.text('User Name');
    this.setProfileNavAvatar();
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
    this.authGuard();
    this.loadAvatars();
    this.setProfileNavName();
    if (this.isProfilePage()) {
      this.loadProfileHeader();
      this.loadProfileAbout();
      this.loadProfileEdit();
      this.hideLoadingScreen();
    } else if (this.isAccountSettingsPage()) {
      this.loadAccountInfo();
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
    this.setProfileNavAvatar();
    this.setProfileHeaderAvatar();
  },
  loadAccountInfo: function() {
    this.$accountEmail.text(this.user.email);
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
    this.$signoutButton = $('.link-logout');

    // profile about
    this.$aboutPhone = $('#about-phone');
    this.$aboutContactEmail = $('#about-contact-email');
    this.$aboutLocation = $('#about-location');
    this.$aboutPosition = $('#about-position');
    this.$aboutBio = $('#about-bio');

    // profile edit
    this.$editProfileForm = $('#wf-form-profile');
    this.$editPhotoUpload = $('#photo-upload');
    this.$editFirstName = $('#edit-first-name');
    this.$editLastName = $('#edit-last-name');
    this.$editLocation = $('#edit-location');
    this.$editContactEmail = $('#edit-contact-email');
    this.$editPhone = $('#edit-phone');
    this.$editFacebookUrl = $('#edit-facebook-url');
    this.$editInstagramUrl = $('#edit-instagram-url');
    this.$editTwitterUrl = $('#edit-twitter-url');
    this.$editBio = $('#edit-bio');

    // account
    this.$changeEmailButton = $('#change-email-button');
    this.$changeEmailModal = $('#email-modal');
    this.$changeEmailForm = $('#email-modal-form');
    this.$accountEmail = $('#account-email');
    this.$resetPassword = $('#account-reset-password-link');
    this.$resetPasswordModal = $('#reset-password-modal');
    this.$resetPasswordForm = $('#reset-password-modal-form');
    this.$updatePasswordForm = $('#update-password-form');
    this.$deleteAccountButton = $('#delete-account-button');
    this.$deleteAccountModal = $('#delete-account-modal');
    this.$deleteAccountConfirm = $('#delete-account-confirm-button');
  },
  bindEventListeners: function() {
    if (this.isSignupPage()) {
      this.signupForm.addEventListener('submit', this.handleSignup.bind(this), true);
    } else if (this.isSigninPage()) {
      this.signinForm.addEventListener('submit', this.handleSignin.bind(this), true);
      this.$signinGoogleButton.click(this.handleGoogleSignin.bind(this));
      this.$forgotPasswordLink.click(this.handleForgotPasswordReset.bind(this));
    } else if (this.isProfilePage()) {
      this.$editProfileForm.submit(this.handleProfileEdit.bind(this));
    } else if (this.isAccountSettingsPage()) {
      this.$changeEmailButton.click(this.showChangeEmailModal.bind(this));
      this.$changeEmailForm.get(0).addEventListener('submit', this.handleEmailChange.bind(this), true);
      this.$resetPassword.click(this.showResetPasswordModal.bind(this));
      this.$resetPasswordForm.submit(this.handleAccountPasswordReset.bind(this));
      this.$updatePasswordForm.get(0).addEventListener('submit', this.handleUpdatePassword.bind(this), true);
      this.$deleteAccountButton.click(this.showDeleteAccountModal.bind(this));
      this.$deleteAccountConfirm.click(this.handleDeleteAccount.bind(this))
    }
    this.$signoutButton.click(this.handleSignout.bind(this));
  },

  showChangeEmailModal: function() {
    this.$changeEmailModal.attr('style', '').fadeIn();
  },
  handleEmailChange: function(event) {
    event.preventDefault();
    event.stopPropagation();
    let newEmail = this.$changeEmailForm.find('#name-3').val();
    let password = this.$changeEmailForm.find('#name-4').val();
    let credentials = firebase.auth.EmailAuthProvider.credential(this.user.email, password);
    this.$success = this.$changeEmailForm.siblings('.success-message');
    this.$error = this.$changeEmailForm.siblings('.error-message');

    this.user.reauthenticateWithCredential(credentials)
      .then(function() {
        this.user.updateEmail(newEmail)
        .then(function() {
          this.displaySuccess('Your email address has been updated to ' + newEmail);
          setTimeout(function() {
            this.$changeEmailModal.fadeOut();
            this.$changeEmailForm.get(0).reset();
            this.$accountEmail.text(newEmail);
          }.bind(this), SUCCESS_MESSAGE_DELAY);
        }.bind(this))
        .catch(this.displayError.bind(this));
      }.bind(this))
      .catch(this.displayError.bind(this));
  },
  showResetPasswordModal: function(event) {
    event.preventDefault();
    this.$resetPasswordModal.attr('style', '').fadeIn();
  },
  handleAccountPasswordReset: function(event) {
    let email = $('#password-reset-email').val();
    this.$success = this.$resetPasswordForm.siblings('.success-message');
    this.$error = this.$resetPasswordForm.siblings('.error-message');

    firebase.auth().sendPasswordResetEmail(email)
      .then(function() {
        this.displaySuccess('Password reset email sent to ' + email);
        setTimeout(function() {
          this.$resetPasswordModal.toggle(false);
          this.$resetPasswordForm.toggle().get(0).reset();
          this.$success.toggle(false);
        }.bind(this), SUCCESS_MESSAGE_DELAY);
      }.bind(this))
      .catch(this.displayError.bind(this));
  },
  handleUpdatePassword: function(event) {
    event.preventDefault();
    event.stopPropagation();
    let currentPassword = $('#current-password').val();
    let newPassword = $('#new-password').val();
    let repeatPassword = $('#repeat-password').val();
    let credentials = firebase.auth.EmailAuthProvider.credential(this.user.email, currentPassword);
    this.$success = this.$updatePasswordForm.siblings('.success-message');
    this.$error = this.$updatePasswordForm.siblings('.error-message');

    if (newPassword === repeatPassword) {
      this.user.reauthenticateWithCredential(credentials)
      .then(function() {
        this.user.updatePassword(newPassword)
        .then(function() {
          this.$updatePasswordForm.get(0).reset();
          this.displaySuccess('Your password has been updated.');
          setTimeout(function() {
            this.$success.toggle(false);
          }.bind(this), SUCCESS_MESSAGE_DELAY);
        }.bind(this))
        .catch(this.displayError.bind(this));
      }.bind(this))
      .catch(this.displayError.bind(this));
    } else {
      this.displayError('Passwords do not match.');
    }
  },
  handleForgotPasswordReset: function() {
    let email = $('#email').val();
    if (email) {
      firebase.auth().sendPasswordResetEmail(email)
        .then(function() {
          this.displaySuccess('Password reset email sent to ' + email);
        }.bind(this))
        .catch(this.displayError.bind(this));
    } else {
      this.displayError("Please enter your email address above and click link again.");
    }
  },
  showDeleteAccountModal: function() {
    this.$deleteAccountModal.attr('style', '').fadeIn();
  },
  handleDeleteAccount: function() {
    this.user.delete().then(function() {
      redirectToHome();
    }).catch(logError);
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
    log('redirecting from ' + location.pathname + ' to ' + path);
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
  if (LOGGING_ENABLED) {
    console.log(message);
  }
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