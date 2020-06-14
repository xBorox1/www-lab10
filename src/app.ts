const express = require('express');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const session = require('express-session');
const connect = require('connect-sqlite3');

const SQLiteStore = connect(session);

let sess = {
    store: new SQLiteStore(),
    secret: 'session',
    cookie: { maxAge: 900000 },
    resave: false,
    saveUninitialized: true,
};

const app = express();
app.use(cookieParser());
app.use(session(sess));
const port = 3000;

class Meme {
    id: number;
    name: string;
    history: number[];
    url: string;

    constructor(id, name, url) {
        this.id = id;
        this.name = name;
        this.history = [];
        this.url = url;
    }

    change_price(price) {
        this.history.push(price);
        sqlite3.verbose();
        let db = new sqlite3.Database('baza.db');
        db.run('INSERT INTO history (meme_id, price, ord) VALUES (' + this.id + ', ' + price + ', ' + (this.history.length - 1) + ');');
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

        db.each('SELECT meme_id, price FROM history ORDER BY ord;', [], (err, row) => {
            if (err) throw(err);
            let {meme_id, price} = row;
            memes[meme_id].history.push(price);
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
        {return b.history.slice(-1)[0] - a.history.slice(-1)[0];});
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

app.set('view engine', 'pug');

app.get('/', function(req, res) {
    actViews(req.session);
    res.render('index', { title: 'Meme market', message: 'Hello there!', memes: most_expensive(), viewsNum: req.session.views })
});

app.get('/meme/:memeId', csrfProtection, function (req, res) {
    actViews(req.session);
    let meme = get_meme(req.params.memeId);
    res.render('meme', { meme: meme, csrfToken: req.csrfToken(), viewsNum: req.session.views });
})

app.use(express.urlencoded({
    extended: true
}));

app.post('/meme/:memeId', parseForm, csrfProtection, function (req, res) {
    let meme = get_meme(req.params.memeId);
    let price = req.body.price;
    meme.change_price(price);
    res.render('meme', { meme: meme, csrfToken: req.csrfToken() });
})

app.listen(port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});

let basicMemes = [ new Meme(1, "Gold", 'https://i.redd.it/h7rplf9jt8y21.png'),
    new Meme(2, "Platinum", 'http://www.quickmeme.com/img/90/90d3d6f6d527a64001b79f4e13bc61912842d4a5876d17c1f011ee519d69b469.jpg'),
    new Meme(3, "Elite", 'https://i.imgflip.com/30zz5g.jpg'),
    new Meme(4, "Another", 'http://www.quickmeme.com/img/e8/e849d91ad0841af515b0b1d55acf5877b1bef22f8121aad8ac5137ccc2871dcc.jpg'),
    new Meme(5, "Polish", 'https://i.pinimg.com/474x/48/ed/d8/48edd8204da323e858c9a77a84789af6.jpg'),
    new Meme(6, "Boromir", 'https://i.wpimg.pl/O/335x282/d.wpimg.pl/2415135-1935720870/meme.jpg'),
    new Meme(7, "Political", 'https://www.wprost.pl/_thumb/75/6f/7e2ba24f862eac47fdfb039f1afa.jpeg'),
    new Meme(8, "Avocado", 'https://www.fosi.org/media/images/funny-game-of-thrones-memes-coverimage.width-800.jpg'),
    new Meme(9, "500+", 'https://www.wprost.pl/_thumb/9b/5c/d73d4f3bfae704d20c0d99cf201c.jpeg'),
    new Meme(10, "Clever", 'https://parade.com/wp-content/uploads/2020/03/coronavirus-meme-watermark-gray.jpg')
]

function createDB() {
    sqlite3.verbose();
    let db = new sqlite3.Database('baza.db');
    db.run('CREATE TABLE memes (id INT, name VARCHAR(255), url VARCHAR(255));');
    db.run('CREATE TABLE history (meme_id INT, price INT, ord INT);');
    db.close();
}

function writeMemes() {
    sqlite3.verbose();
    let db = new sqlite3.Database('baza.db');
    let memeCommand = 'INSERT INTO memes (id, name, url) VALUES ';
    let curId = 0;
    for(const meme of basicMemes) {
        memeCommand += "(" + curId + ", \"" + meme.name + "\", \"" + meme.url + "\")";
        curId++;
        if(curId != basicMemes.length) memeCommand += ', ';
    }
    memeCommand += ';';
    db.run(memeCommand);
    db.close();
}

function clearDB() {
    sqlite3.verbose();
    let db = new sqlite3.Database('baza.db');
    db.run('DROP TABLE memes;');
    db.run('DROP TABLE history;');
    db.close();
}

//clearDB();
//createDB();
//writeMemes();
