import * as sqlite3 from 'sqlite3';

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
    db.run('CREATE TABLE history (meme_id INT, price INT, order INT);');
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

createDB();
writeMemes();
