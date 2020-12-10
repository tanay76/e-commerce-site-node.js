// $(function() {
//   $('#ok_btn').on('click', function() {
//     $('.user-message--success').css('display', 'none');
//   });

//   $('main').on('click', '#ok1', function() {
//     $('.user-message--error').css('display', 'none');
//   });

//   $('#login-btn').on('click', function(e) {
//     e.preventDefault();
//     // console.log('Login Button Clicked');
//     var userEmail = $('#email').val();
//     // console.log('1: ', userEmail);
//     var userPassword = $('#password').val();
//     // console.log('2: ', userPassword)
//     var csrf = $('#_csrf').val();
//     // console.log('3: ', csrf);
//     var output1 = '';
//     var userData = {
//       email: userEmail,
//       password: userPassword
//     };
//     $.ajax({
//       url: '/login',
//       type: 'POST',
//       headers: {
//         'csrf-token': csrf
//       },
//       data: userData,
//       dataType: 'json',
//       success: function(data) {
//         if (data.errorMessage !== '') {
//           output1 += `
//           <div class="user-message user-message--error">${data.errorMessage}<button class="btn" id="ok1">OK</button></div>
//           `
//           $('.login-form').before($(output1));

//           // $('#ok1').on('click', function() {
//           //   $('.user-message--error').css('display', 'none');
//           // });
//         }
//       }
//     });
//   });
// });

// const loginBtn = document.getElementById('login-btn');

// const dummyText = ' DUMMY TEXT ';
// if(dummyText.trim() == 'DUMMY TEXT') {
//   console.log(true);
// }

//==================================================
//Ajaxification done with fetch() method
//==================================================

// const loginDone = () => {
//   const userEmail = document.getElementById('email').value;
//   const userPassword = document.getElementById('password').value;
//   const csrf = document.getElementById('_csrf').value;
//   const noError = document.getElementById('no-error');
//   const userId = document.getElementById('userId');

//   const loginForm = document.querySelector('.login-form');
//   const loginBtn = document.getElementById('login-btn');

//   if (noError.value === 'false') {
//     fetch(userId ? '/activation-login' : '/login', {
//       method: 'POST',
//       headers: {
//         'csrf-token': csrf,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         email: userEmail,
//         password: userPassword,
//         userId: userId ? userId.value : null,
//         noError: noError.value,
//       }),
//     })
//       .then((result) => {
//         return result.json();
//       })
//       .then((data) => {
//         let errorDiv;
//         let errorBtn;
//         if (data.errorMessage !== null) {
//           errorDiv = document.createElement('div');
//           errorBtn = document.createElement('button');
//           errorBtn.className = 'btn';
//           errorBtn.id = 'ok1';
//           errorBtn.innerText = 'OK';
//           errorBtn.addEventListener('click', () => {
//             errorDiv.remove();
//           });
//           errorDiv.className = 'user-message user-message--error';
//           errorDiv.innerText = data.errorMessage;
//           errorDiv.append(errorBtn);

//           loginForm.before(errorDiv);
//         } else {
//           noError.value = data.message;
//           loginBtn.removeAttribute('type');
//           loginBtn.removeAttribute('onclick');
//           loginBtn.click();
//         }
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
// };

//===========================================
// Alternative axios way of Ajaxification
//===========================================

const loginDone = (e) => {
  e.preventDefault();
  const userEmail = document.getElementById('email').value;
  const userPassword = document.getElementById('password').value;
  const csrf = document.getElementById('_csrf').value;
  const noError = document.getElementById('no-error');
  const userId = document.getElementById('userId');

  const loginForm = document.querySelector('.login-form');
  const loginBtn = document.getElementById('login-btn');

  if (noError.value === 'false') {
    axios({
      method: 'POST',
      url: userId ? '/activation-login' : '/login',
      data: {
        email: userEmail,
        password: userPassword,
        userId: userId ? userId.value : null,
        noError: noError.value,
      },
      headers: {
        'csrf-token': csrf,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        let errorDiv;
        let errorBtn;
        if (response.data.errorMessage !== null) {
          errorDiv = document.createElement('div');
          errorBtn = document.createElement('button');
          errorBtn.className = 'btn';
          errorBtn.id = 'ok1';
          errorBtn.innerText = 'OK';
          errorBtn.addEventListener('click', () => {
            errorDiv.remove();
          });
          errorDiv.className = 'user-message user-message--error';
          errorDiv.innerText = response.data.errorMessage;
          errorDiv.append(errorBtn);

          loginForm.before(errorDiv);
        } else {
          noError.value = response.data.message;
          loginBtn.removeAttribute('onclick');
          loginBtn.click();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const okDone = () => {
  document.querySelector('.user-message--success').remove();
};

//==============================================
// Ajaxification through fetch() method
//==============================================

const deleteProduct = (btn) => {
  const prodId = document.getElementById('productId').value;
  const userId = document.getElementById('userId').value;
  const csrf = document.getElementById('csrf').value;

  const gridDiv = document.querySelector('.grid');

  const productElement = btn.closest('article');

  let successDiv;
  let successBtn;
  fetch('/admin/delete-product', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prodId: prodId,
      userId: userId,
    }),
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      successDiv = document.createElement('div');
      successBtn = document.createElement('button');
      successBtn.className = 'btn';
      successBtn.id = 'ok_btn';
      successBtn.innerText = 'OK';
      successBtn.addEventListener('click', () => {
        productElement.parentNode.removeChild(productElement);
        successDiv.remove();
      });
      successDiv.className = 'user-message user-message--success';
      successDiv.innerText = data.message;
      successDiv.append(successBtn);

      gridDiv.before(successDiv);
    })
    .catch((err) => {
      console.log(err);
    });
};

//====================================================================================
//Ajaxification of SignUp form with axios()
//====================================================================================
const ajaxifySignUp = () => {
  const userEmail = document.getElementById('email').value;
  const userPassword = document.getElementById('password').value;
  const userConfPassword = document.getElementById('confirmPassword').value;
  const csrf = document.getElementById('csrf').value;
  const noError = document.getElementById('no-error'); 

  const loginForm = document.querySelector('.login-form');
  const signupBtn = document.getElementById('signup-btn');

  if (noError.value === 'false') {
    axios({
      method: 'POST',
      url: '/signup',
      headers: {
        'csrf-token': csrf,
        'Content-type': 'application/json',
      },
      data: {
        email: userEmail,
        password: userPassword,
        confirmPassword: userConfPassword,
        noError: noError.value
      }
    })
    .then((response) => {
      let errorDiv;
      let errorBtn;
      // console.log(response.data.errorMessage);
      if (response.data.errorMessage !== null) {
        errorDiv = document.createElement('div');
        errorBtn = document.createElement('button');
        errorBtn.className = 'btn';
        errorBtn.id = 'ok1';
        errorBtn.innerText = 'OK';
        errorBtn.addEventListener('click', () => {
          errorDiv.remove();
        });
        errorDiv.className = 'user-message user-message--error';
        errorDiv.innerText = response.data.errorMessage;
        errorDiv.append(errorBtn);

        loginForm.before(errorDiv);
      } else {
        // console.log(response.data.message);
        noError.value = response.data.message;
        signupBtn.removeAttribute('type');
        signupBtn.removeAttribute('onclick');
        signupBtn.click();
      }
    })
    .catch((err) => {
      console.log(err);
    });
  }
};

//======================================================================================

const onBlurTitle = (element, onlyCheck) => {
  const errorSpace = element.parentNode.querySelector('.error-space');
  let errorMessage = '';

  if (element.value.trim().length < 5) {
    errorMessage = 'Title should be minimum 5 characters long.';
  }

  if (onlyCheck) {
    return errorMessage;
  }

  errorSpace.innerText = errorMessage;
};

const onChangeTitle = (element) => {
  const validation = JSON.parse(element.parentElement.parentElement.dataset.validation);
  const button = document.getElementById('submit');

  button.className = 'btn btn--inactive';
  button.setAttribute('type', 'button');

  const editedValidation = {
    ...validation,
    title: false,
    // price: validation.price,
    // image: validation.image,
    // description: validation.description,
  }

  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  if (onBlurTitle(element, true) !== '') {
    return;
  }
  editedValidation.title = true;
  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  if (!validation.price || !validation.image || !validation.description) {
    return;
  }
  
  button.className = 'btn';
  button.removeAttribute('type');
};

const onBlurPrice = (element, onlyCheck) => {
  const errorSpace = element.parentNode.querySelector('.error-space');
  let errorMessage = '';

  if (element.value === '' || +element.value <= 0.0) {
    errorMessage = 'Price Cannot be Empty or Zero';
  }

  if (onlyCheck) {
    return errorMessage;
  }

  errorSpace.innerText = errorMessage;
};

const onChangePrice = (element) => {
  const validation = JSON.parse(element.parentElement.parentElement.dataset.validation);
  const button = document.getElementById('submit');

  button.className = 'btn btn--inactive';
  button.setAttribute('type', 'button');

  const editedValidation = {
    title: validation.title,
    price: false,
    image: validation.image,
    description: validation.description,
  }

  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  if (onBlurPrice(element, true) !== '') {
    return;
  }
  editedValidation.price = true;
  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  if (!validation.title || !validation.image || !validation.description) {
    return;
  }
  
  button.className = 'btn';
  button.removeAttribute('type');
};

const onFocusImage = (element) => {
  element.dataset.onFocus = 'true';
};

const onFocusOtherFields = (onlyCheck) => {
  const image = document.getElementById('image');
  const prodId = document.getElementById('productId');
  const onFocus = image.dataset.onFocus;
  if (onFocus === 'false') {
    return 'error';
  }
  const errorSpace = image.parentNode.querySelector('.error-space');
  let errorMessage = '';

  if (image.files.length == 0 && !prodId) {
    errorMessage = 'Please choose an image.';
  } else if (
    image.files[0] &&
    image.files[0].type !== 'image/png' &&
    image.files[0].type !== 'image/jpg' &&
    image.files[0].type !== 'image/jpeg'
  ) {
    errorMessage = 'Please choose an image file with .jpg, .jpeg or .png.';
  }
  if (onlyCheck) {
    return errorMessage;
  }
  errorSpace.innerText = errorMessage;
};

const onChangeImage = (element) => {
  const validation = JSON.parse(element.parentElement.parentElement.dataset.validation);
  const button = document.getElementById('submit');

  button.className = 'btn btn--inactive';
  button.setAttribute('type', 'button');

  const editedValidation = {
    title: validation.title,
    price: validation.price,
    image: false,
    description: validation.description,
  }

  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  if (onFocusOtherFields(true) !== '') {
    return;
  }
  editedValidation.image = true;
  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  if (!validation.title || !validation.price || !validation.description) {
    return;
  }
  
  button.className = 'btn';
  button.removeAttribute('type');
};

const onChangeDescription = (element) => {
  const validation = JSON.parse(element.parentElement.parentElement.dataset.validation);
  const button = document.getElementById('submit');

  const descriptionHintText = document.getElementById('description-hint-text');
  const wordLimit = document.getElementById('word-limit');

  button.className = 'btn btn--inactive';
  button.setAttribute('type', 'button');

  const editedValidation = {
    title: validation.title,
    price: validation.price,
    image: validation.image,
    description: false,
  }

  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  wordLimit.innerText = `${element.value.length}/400`;
  if (element.value.length < 5) {    
    descriptionHintText.style.color = '';
    return;
  }
  descriptionHintText.style.color = 'green';
  editedValidation.description = true;
  element.parentElement.parentElement.dataset.validation = JSON.stringify(editedValidation);

  if (!validation.title || !validation.price || !validation.image) {
    return;
  }
  
  button.className = 'btn';
  button.removeAttribute('type');
};
