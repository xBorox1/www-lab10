const express = require('express');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')

const app = express();
app.use(cookieParser());
const port = 3000;

interface Meme {
    id: number;
    name: string;
    history: number[];
    url: string;
}

const Meme = class Meme {
    constructor(id, name, history, url) {
        this.id = id;
        this.name = name;
        this.history = history;

        this.url = url;
    }

    change_price(price) {
        this.history.push(price);
    }
}

let memes = [ new Meme(1, "Gold", [1000, 2000, 1000], 'https://i.redd.it/h7rplf9jt8y21.png'),
              new Meme(2, "Platinum", [1300, 1200, 1100], 'http://www.quickmeme.com/img/90/90d3d6f6d527a64001b79f4e13bc61912842d4a5876d17c1f011ee519d69b469.jpg'),
              new Meme(3, "Elite", [1500, 1301, 1302], 'https://i.imgflip.com/30zz5g.jpg'),
              new Meme(4, "Another", [1500, 1300], 'http://www.quickmeme.com/img/e8/e849d91ad0841af515b0b1d55acf5877b1bef22f8121aad8ac5137ccc2871dcc.jpg'),
              new Meme(5, "Polish", [1500, 2000, 1300], 'https://i.pinimg.com/474x/48/ed/d8/48edd8204da323e858c9a77a84789af6.jpg'),
              new Meme(6, "Boromir", [1500, 800], 'https://i.wpimg.pl/O/335x282/d.wpimg.pl/2415135-1935720870/meme.jpg'),
              new Meme(7, "Political", [300, 900], 'https://www.wprost.pl/_thumb/75/6f/7e2ba24f862eac47fdfb039f1afa.jpeg'),
              new Meme(8, "Avocado", [1500, 2000], 'https://www.fosi.org/media/images/funny-game-of-thrones-memes-coverimage.width-800.jpg'),
              new Meme(9, "500+", [500], 'https://www.wprost.pl/_thumb/9b/5c/d73d4f3bfae704d20c0d99cf201c.jpeg'),
              new Meme(10, "Clever", [1500, 5000], 'https://parade.com/wp-content/uploads/2020/03/coronavirus-meme-watermark-gray.jpg')
]

const csrfProtection = csurf({cookie: true});
const parseForm = bodyParser.urlencoded({ extended: false })

function most_expensive() {
    let sortedMemes = memes;
    sortedMemes.sort((a, b) =>
        {return b.history.slice(-1)[0] - a.history.slice(-1)[0];});
    return sortedMemes.slice(0, 3);
}

function get_meme(id) {
    for(let mem of memes) {
        if(mem.id == id) return mem;
    }
}

app.set('view engine', 'pug');
app.get('/', function(req, res) {
    res.render('index', { title: 'Meme market', message: 'Hello there!', memes: most_expensive() })
});

app.get('/meme/:memeId', csrfProtection, function (req, res) {
    let meme = get_meme(req.params.memeId);
    res.render('meme', { meme: meme, csrfToken: req.csrfToken() });
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

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
