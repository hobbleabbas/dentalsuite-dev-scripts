DEFAULT_PROFILE_PHOTO_URL = 'https://firebasestorage.googleapis.com/v0/b/dentalsuite-7521f.appspot.com/o/default-photo.png?alt=media&token=375826ab-c96f-4046-80a5-b0bb9b941823';

let App = {
  user: null,

  userFirstName: function() {
    let displayName = this.user.displayName
    if (displayName) {
      return displayName.split(' ')[0];
    }
  },
  userEmailPrefix: function() {
    return this.user.email.split('@')[0];
  },

  signup: function(data) {
    firebase.auth().createUserWithEmailAndPassword(data.email, data.password)
      .then(redirectToProfile)
      .catch(this.displaySignupError.bind(this));
  },
  signin: function(data) {
    firebase.auth().signInWithEmailAndPassword(data.email, data.password)
      .then(redirectToProfile)
      .catch(logError);
  },
  signinGoogle: function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(function(result) {
        this.user = result.user;
        redirectToProfile();
      }.bind(this)).catch(logError);
  },
  signout: function() {
    firebase.auth().signOut();
    redirectToHome();
  },
  displaySignupError: function(error) {
    this.$signupError.text(error.message);
  },

  updateProfile: function(data) {
    this.user.updateProfile(data)
      .catch(logError);
  },

  putFileInStorage: function(file) {
    let storageRef = firebase.storage().ref();
    let path = `avatars/${this.user.uid}`;
    let avatarRef = storageRef.child(path);
    avatarRef.put(file).then(function(snapshot) {
      avatarRef.getDownloadURL().then(function(url) {
        this.updateProfile({photoURL: url});
        location.reload();
      }.bind(this)).catch(logError);
    }.bind(this)).catch(logError);
  },
  putDataInDatabase: function(data) {
    let dbRef = firebase.database().ref('users/' + this.user.uid);
    dbRef.set(data);
  },
  getDataFromDatabase: function() {
    let dbRef = firebase.database().ref('users/' + this.user.uid);
    return dbRef.once('value');
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
        this.getDataFromDatabase().then(snapshot => {
          this.userData = snapshot.val() || {};
          this.loadPageData();
        }).catch(logError);
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
    let attribute = {style: `background-image: url(${this.user.photoURL})`};
    this.$profileAvatarButton.attr(attribute);
    this.$profileNameButton.text(this.userFirstName() || this.userEmailPrefix());
    this.$profileAvatarNameSection.toggle(true);
  },
  toggleNavUserLoggedInWithoutPhoto: function() {
    this.$loginButton.toggle(false);
    let attribute = {style: `background-image: url(${DEFAULT_PROFILE_PHOTO_URL})`};
    this.$profileAvatarButton.attr(attribute);
    this.$profileNameButton.text(this.userFirstName() || this.userEmailPrefix());
    this.$profileAvatarNameSection.toggle(true);
  },
  toggleNavUserLoggedOut: function() {
    let attribute = {style: `background-image: url(${DEFAULT_PROFILE_PHOTO_URL})`};
    this.$profileAvatarButton.attr(attribute);
    this.$profileNameButton.text('User Name');
    this.$profileAvatarNameSection.toggle(false);
    this.$loginButton.toggle(true);
  },

  loadPageData: function() {
    if (location.pathname === "/profile/user-profile") {
      this.loadProfileHeader();
      this.loadProfileAbout();
      this.loadProfileEdit();
    }
  },
  loadProfileHeader: function() {
    this.$usernameWelcome.text(this.user.displayName);
    let photoURL = this.user.photoURL || DEFAULT_PROFILE_PHOTO_URL;
    this.$userAvatar.attr('src', photoURL);
    this.$usernameHeader.text(this.user.displayName);
  },
  loadProfileAbout: function() {
    let data = this.userData;
    this.$aboutPhone.text(data.phone);
    let day = data['birthdate-day'],
        month = data['birthdate-month'],
        year = data['birthdate-year'];
    let birthdate = `${day}.${month}.${year}`;
    this.$aboutBirthdate.text(birthdate);
    this.$aboutContactEmail.text(data['contact-email']);
    this.$aboutLocation.text(data.location);
    this.$aboutPosition.text(data.position || '');
    this.$aboutBio.text(data.bio);
  },
  loadProfileEdit: function() {
    let data = this.userData;
    let displayName = this.user.displayName;
    let names = displayName ? displayName.split(' ') : ['', ''];
    this.$editFirstName.val(names[0]);
    this.$editLastName.val(names[1]);
    this.$editBirthdateDay.val(data['birthdate-day']);
    this.$editBirthdateMonth.val(data['birthdate-month']);
    this.$editBirthdateYear.val(data['birthdate-year']);
    this.$editLocation.val(data.location);
    this.$editContactEmail.val(data['contact-email']);
    this.$editPhone.val(data.phone);
    this.$editFacebookUrl.val(data['facebook-url']);
    this.$editInstagramUrl.val(data['instagram-url']);
    this.$editTwitterUrl.val(data['twitter-url']);
    this.$editBio.val(data.bio);
  },

  bindElements: function() {
    // nav
    this.$loginButton = $('#login-button');
    this.$profileAvatarButton = $('#profile-avatar-button');
    this.$profileNameButton = $('#profile-name-button');
    this.$profileAvatarNameSection = $('#profile-avatar-and-name');

    // sign up
    this.signupForm = document.getElementById('signupForm');
    this.$signupAgreeToTermsCheckbox = $('#sigupCheckbox');
    this.$signupError = $('#signupError');

    // sign in
    this.signinForm = document.getElementById('signinForm');
    this.$signinGoogleButton = $('#signin-google-button');
    this.$signinRememberMeCheckbox = $('#signinCheckbox');
    this.$forgotPasswordLink = $('#forgotPasswordLink');

    // profile general
    this.$usernameWelcome = $('#username-welcome');
    this.$backgroundHeaderImage = $('#background-header-image');
    this.$editBackgroundImageButton =$('#edit-background-image');
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
    if (this.signupForm) {
      this.signupForm.addEventListener('submit', this.handleSignup.bind(this), true);
    } else if (this.signinForm) {
      this.signinForm.addEventListener('submit', this.handleSignin.bind(this), true);
    }
    this.$signinGoogleButton.click(this.handleGoogleSignin.bind(this));
    this.$editProfileForm.submit(this.handleProfileEdit.bind(this));
    this.$signoutButton.click(this.handleSignout.bind(this));
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
    console.log('from handleSignup()');
    console.log(data);
    this.signup(data);
  },
  handleSignin: function(event) {
    event.preventDefault();
    event.stopPropagation();
    let data = {
      email: $('#email').val(),
      password: $('#password').val(),
    };
    console.log('from handleSignin()');
    console.log(data);
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
    this.extractAndProcessUsernameFromFormData(data);
    this.putDataInDatabase(data);
  },
  extractAndProcessPhotoFromFormData: function(data) {
    if (data['photo-upload'].name) {
      let file = data['photo-upload'];
      this.putFileInStorage(file);
      delete data['photo-upload'];
    }
  },
  extractAndProcessUsernameFromFormData: function(data) {
    if (data['first-name'] || data['last-name']) {
      let first = data['first-name'].trim(),
          last = data['last-name'].trim();
      let username = first + ' ' + last;
      this.updateProfile({displayName: username});
      delete data['first-name'];
      delete data['last-name'];
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