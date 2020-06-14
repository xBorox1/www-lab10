const express = require('express');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const session = require('express-session');
const connect = require('connect-sqlite3');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const flash = require('express-flash');

const SQLiteStore = connect(session);

let sess = {
    store: new SQLiteStore(),
    secret: 'session',
    resave: true,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 9
    }
};

let users = [];

const authenticateUser = async (username, password, done) => {
    const user = users.find(user => user.username === username);
    if (user == null) {
        return done(null, false, {message: 'No user with that username'})
    }
    try {
        if (await bcrypt.compare(password, user.password)) {
            return done(null, user)
        } else {
            return done(null, false, {message: 'Password incorrect'})
        }
    } catch (e) {
        return done(e)
    }
}

passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser))
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
    return done(null, () => users.find(user => user.id === id))
})

const app = express();
app.use(cookieParser());
app.use(session(sess));
app.use(bodyParser.json());
app.use(flash());
app.use(express.urlencoded({
    extended: true
}));
app.use(passport.initialize());
app.use(passport.session());
const port = 3000;

class Meme {
    id: number;
    name: string;
    history: [number, string][];
    url: string;

    constructor(id, name, url) {
        this.id = id;
        this.name = name;
        this.history = [[0, "admin"]];
        this.url = url;
    }

    change_price(price, username) {
        this.history.push([price, username]);
        sqlite3.verbose();
        let db = new sqlite3.Database('baza.db');
        db.run('INSERT INTO history (meme_id, username, price, ord) VALUES (' + this.id + ', ' + "\"" + username + "\"" + ', ' + price + ', ' + (this.history.length - 1) + ');');
        db.close();
    }
}

function getMemes() {
    sqlite3.verbose();
    let memes :Meme[] = [];
    let db = new sqlite3.Database('baza.db');

    db.serialize(function() {
        db.each('SELECT * FROM memes ORDER BY id;', [], (err, row) => {
            if (err) throw(err);
            let {id, name, url} = row;
            memes.push(new Meme(id, name, url));
        });

        db.each('SELECT meme_id, username, price FROM history ORDER BY ord;', [], (err, row) => {
            if (err) throw(err);
            let {meme_id, username, price} = row;
            memes[meme_id].history.push([price, username]);
        });
    });

    db.close();

    return memes;
}

let memes : Meme[] = getMemes();

const csrfProtection = csurf({cookie: true});
const parseForm = bodyParser.urlencoded({ extended: false })

function most_expensive() {
    let sortedMemes : Meme[] = memes;
    sortedMemes.sort((a, b) =>
        {return b.history.slice(-1)[0][0] - a.history.slice(-1)[0][0];});
    return sortedMemes.slice(0, 3);
}

function get_meme(id) {
    for(let mem of memes) {
        if(mem.id == id) return mem;
    }
}

function actViews(sess) {
    if(sess.views) {
        sess.views++;
    }
    else {
        sess.views = 1;
    }
}

function getUsername(req) {
    if(req.session.passport && req.session.passport.user !== undefined && req.session.passport.user < users.length)
        return users[req.session.passport.user].username;
    return undefined;
}

app.set('view engine', 'pug');

app.get('/', function(req, res) {
    const username = getUsername(req);
    actViews(req.session);
    res.render('index', { title: 'Meme market', message: 'Hello there!', memes: most_expensive(), viewsNum: req.session.views, username: username })
});

app.get('/meme/:memeId', csrfProtection, function (req, res) {
    actViews(req.session);
    let meme = get_meme(req.params.memeId);
    res.render('meme', { meme: meme, csrfToken: req.csrfToken(), viewsNum: req.session.views });
})

app.get('/login', csrfProtection, function(req, res) {
    actViews(req.session);
    res.render('login', { csrfToken: req.csrfToken(), viewsNum: req.session.views })
});

app.get('/register', csrfProtection, function(req, res) {
    actViews(req.session);
    res.render('register', { csrfToken: req.csrfToken(), viewsNum: req.session.views })
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: users.length,
            username: req.body.username,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
});

app.post('/meme/:memeId', parseForm, csrfProtection, function (req, res) {
    const username = getUsername(req);
    if(username === undefined) {
        res.send("You are not logged in!");
        return;
    }
    let meme = get_meme(req.params.memeId);
    let price = req.body.price;
    meme.change_price(price, username);
    res.render('meme', { meme: meme, csrfToken: req.csrfToken() });
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/')
})

app.listen(port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});

