const path = require('path');
require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');
const paytmRoutes = require('./routes/paytm');
const User = require('./models/user');

const app = express();

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.fieldname + '-' + file.originalname);
    }
});

// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'image/png' || 
//         file.mimetype === 'image/jpg' || 
//         file.mimetype === 'image/jpeg') {
//         cb(null, true);
//     } else {
//         cb(null, false);
//     }
// };

app.set('view engine', 'ejs');
app.set('views', 'views');

const MONGODB_URI = process.env.MONGODB_URI;

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(
    multer({ storage: fileStorage}).single('image')
);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/paytm', paytmRoutes); //this is declared before session & csrf middlewares because this  route will else get disturbed by the csrfToken and new sessions sent by Paytm.

app.use(
    session({
        secret: process.env.sessionSecret,   // You can write any random String of your choice
        resave: false,                      // and more complex more better and you should keep it
        saveUninitialized: false,           // in .env file before uploading it to Github
        store:store,
    })
); 

app.use(flash());                                                                //  🔼
                                                                                  // 🔼
                                                                                  // 🔼
app.use(csrfProtection);

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
                                        // console.log('isAuthenticated: ',req.session.isLoggedIn);
                                        // res.locals.isAuthenticated = req.session.isLoggedIn;  // res.locals allows us to set loacl
    res.locals.csrfToken = req.csrfToken();      // variables that are passed into the views, local
    next();                                  // simply becuse they exist in only int the views which
});                                             // are rendered.                //   🔼
                                                                                 //  🔼
app.use((req, res, next) => {    // ------write this code after defining session here🔼, otherwise
    
    if (!req.session.user) {  // this command will not be able to recognize the session in the
        next();                 // req.session here
    } else if (req.session.user) {
        User.findById(req.session.user._id)
        .then(user => {
            // throw new Error('Dummy');
            if (!user) {
                return next();
            }
            req.user = user;
            // console.log('USER: ', req.user);
            next();
        })
        .catch(err => {
            return next(new Error(err));
        });
    }
});

// app.post('/callback', shopController.postCallback);
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500Page);

app.use(errorController.get404Page);

// app.use((error, req, res, next) => {
//     res.status(500).render('500', {
//         pageTitle:'Error Page', 
//         path:'/500',
//         // isAuthenticated: req.session.isLoggedIn
//     });
// });

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(3000, () => {
        console.log('NodeJs server running on port 3000');
    });
})
.catch(err => {
    console.log(err);
});