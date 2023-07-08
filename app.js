const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const fs = require('fs')
const mysql = require('mysql');
const { unescape } = require('querystring');
const app = express();
const port = 6789;
const oneDay = 1000 * 60 * 60 * 24
// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(sessions({
    secret: "secretkey25",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului
//este views / layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client
//(e.g., fișiere css, javascript, imagini)
app.use(express.static(__dirname + '/public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în
//format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello
//World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.use((req, res, next) =>{
    console.log("ip: " + req.ip + ",, " + authenticationList[req.ip]);
    if(invalidIp[req.ip] != undefined){
        if(invalidIp[req.ip] > 10){
            setTimeout((ip) => {
                invalidIp[ip] = 0;
            }, 10000, req.ip);
            invalidIp[req.ip] = -1;
            res.send('<h1 style="font-size: 50px; text-align: center">Esti cumva HACKERMAN?</h1>');
            return;
        }
        else if(invalidIp[req.ip] == -1){
            res.send('<h1 style="font-size: 50px; text-align: center">Esti cumva HACKERMAN?</h1>');
            return;
        }
    }
    if(authenticationList[req.ip] != undefined){
        if(authenticationList[req.ip] > 4){
            setTimeout((ip) => {
                authenticationList[ip] = 0;
            }, 10000, req.ip);
            authenticationList[req.ip] = -1;
        }
    }
    next();


});
app.get('/', (req, res) => {
    console.log(req.cookies);
    var produse;
    connection = mysql.createConnection({
        host: "localhost",
        user: "donuts",
        password: "donuts"
    });
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        connection.query("USE cumparaturi", function (err, result) {
            if (err) throw err;
            console.log("Using database!");
        });
        connection.query("SELECT * FROM produse", function (err, result, fields) {
            if (err) {
                res.render('index', { username: req.session.username, produse: produse, role: req.session.role });
            }
            else {
                console.log(result);
                produse = result;
                res.render('index', { username: req.session.username, produse: produse, role: req.session.role });
            }

        });
    });
    // else{
    //     res.render('index', { username: req.session.username, produse: produse});
    // }

});
// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția
//specificată
var listaIntrebari;
fs.readFile('intrebari.json', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    listaIntrebari = JSON.parse(data);
});

var listaUsers;
fs.readFile('utilizatori.json', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    listaUsers = JSON.parse(data);
});

app.get('/chestionar', (req, res) => {
    // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care
    //conține vectorul de întrebări
    if (req.session.username != undefined) {
        res.render('chestionar', { username: req.session.username, intrebari: listaIntrebari, role: req.session.role });
    }
    else {
        res.cookie('errorMessage', 'Te rog să te autentifici întâi.').redirect('/autentificare');
    }
});
app.post('/rezultat-chestionar', (req, res) => {
    // console.log(req.body);
    var answers = JSON.parse(JSON.stringify(req.body).replace("'", '"'));
    var correctAnswersCount = 0;
    var correctAnswers = [];
    console.log("correct answers: " + answers);
    for (let i = 0; i < listaIntrebari.length; i++) {
        console.log(answers[i] + ";; " + listaIntrebari[i].corect);
        if (answers[i] == listaIntrebari[i].corect) {
            correctAnswersCount += 1;
            correctAnswers.push(listaIntrebari[i].variante[listaIntrebari[i].corect]);
        }
    }

    if (req.session.username != undefined) {
        res.render('rezultat-chestionar', { username: req.session.username, intrebari: listaIntrebari, correctAnsCount: correctAnswersCount, correctAns: correctAnswers, role: req.session.role });
    }
    else {
        res.cookie('errorMessage', 'Te rog să te autentifici întâi.').redirect('/autentificare');
    }

});
// o variabila pentru a salva sesiunea curenta

app.get('/autentificare', (req, res) => {
    if(authenticationList[req.ip] != undefined && authenticationList[req.ip] == -1){
        res.render('autentificare', { errorMessage: "unauthorized", role: ""});
        return;
    }

    if(!req.session.username){
        errorMessage = req.cookies.errorMessage;
        res.clearCookie('errorMessage');
        res.render('autentificare', { errorMessage: errorMessage, role: ""});
    }
    else{
        res.redirect('/');
    }

});

var authenticationList = {};
app.post('/verificare-autentificare', (req, res) => {
    console.log(req.body);

    for(let i = 0; i < listaUsers.length; i++){
        if (req.body.username == listaUsers[i].username && req.body.password == listaUsers[i].password) {
            console.log(req.session);
            req.session.username = listaUsers[i].lastname + " " + listaUsers[i].firstname;
            req.session.role = listaUsers[i].role;
            authenticationList[req.ip] = 0;

            res.cookie('username', req.session.username).redirect('/');
            return;
        }
    }

    if(authenticationList[req.ip] == undefined){
        authenticationList[req.ip] = 1;
     }
     else{
        authenticationList[req.ip] += 1;
     }
    if(authenticationList[req.ip] <= 4)
        res.cookie('errorMessage', 'Username-ul sau parola sunt incorecte.');

    res.redirect('/autentificare');

});
app.get('/log-out', (req, res) => {
    if (req.session.username != undefined) {
        req.session.destroy();
        res.render('autentificare', { errorMessage: 'User-ul a fost delogat.', role: ""});
    }
    else{
        res.redirect("/");
    }
});
var connection;
app.get('/creare-bd', (req, res) => {
    connection = mysql.createConnection({
        host: "localhost",
        user: "donuts",
        password: "donuts"
    });
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        connection.query("CREATE DATABASE IF NOT EXISTS cumparaturi", function (err, result) {
            if (err) throw err;
            console.log("Database created!");
        });
        connection.query("USE cumparaturi", function (err, result) {
            if (err) throw err;
            console.log("Using database!");
        });
        var sql = "CREATE TABLE if not exists produse (id int auto_increment primary key, name VARCHAR(30), price float)";
        connection.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Table created");
            res.redirect('/');
        })
    });


});
app.get('/inserare-bd', (req, res) => {
    var sql = `INSERT INTO produse (name, price) VALUES ('Milka', 5),
                                                        ('Africana', 2),
                                                        ('Schogetten', 4.5),
                                                        ('Heidi', 6),
                                                        ('Poiana', 3),
                                                        ('Fin Carre', 6),
                                                        ('Alpinella', 1),
                                                        ('Bounty', 3.3),
                                                        ('Snickers', 3.5),
                                                        ('Lion', 3.5)`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Chocolates inserted!");
        res.redirect('/');
    });
});
app.get('/adaugare_cos', (req, res) => {
    console.log(req.query);
    if (req.session.cart == undefined) {
        req.session.cart = [];
    }
    req.session.cart.push(req.query['id']);
    console.log(req.session);

    res.redirect('/');
});

app.get('/vizualizare_cos', (req, res) => {

    if (req.session.username != undefined) {
        console.log(req.query);
        var produse = [];
        cart = req.session.cart;
        console.log('cart: ');
        console.log(cart);
        if (cart) {
            connection.query("SELECT * FROM produse where id in (?)", [cart], function (err, result, fields) {
                if (err) {
                    res.render('vizualizare-cos', { username: req.session.username, produse: produse, role: req.session.role });
                }
                else {

                    for (let i = 0; i < cart.length; i++) {
                        for (let j = 0; j < result.length; j++) {
                            if (cart[i] == result[j].id) {
                                produse.push({ "id": result[j].id, "name": result[j].name, "price": result[j].price });
                                break;
                            }
                        }
                    }
                    console.log('produse::::');
                    console.log(produse);

                    res.render('vizualizare-cos', { username: req.session.username, produse: produse, role: req.session.role });
                }

            });
        }
    }
    else {
        res.cookie('errorMessage', 'Te rog să te autentifici întâi.').redirect('/autentificare');
    }



    // res.redirect('/');
});

app.get('/admin', (req, res) => {
    // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care
    //conține vectorul de întrebări
    if (req.session.username && req.session.role == 'admin') {
        var message =  req.cookies.message;
        res.clearCookie('message');
        res.render('admin', { username: req.session.username, role: req.session.role, message: message});

    }
    else {
        res.cookie('errorMessage', 'Te rog să te autentifici întâi.').redirect('/autentificare');
    }
});
app.post('/adaugare_produse', (req, res) => {
    // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care
    //conține vectorul de întrebări
    if (req.session.username && req.session.role == 'admin') {
        connection.query("INSERT INTO produse (name, price) VALUES (?, ?)",[req.body.name, req.body.price], function (err, result, fields) {
            if (err) {
                res.cookie('message', 'Produsul nu a fost inserat. Probleme cu conexiunea la baza de date.').redirect('/admin');
            }
            else {
                res.cookie('message', 'Produsul a fost inserat cu succes!').redirect('/admin');
            }
            console.log(result);

        });
    }
    else {
        res.cookie('errorMessage', 'Te rog să te autentifici întâi.').redirect('/autentificare');
    }
});





var invalidIp = {};
app.get("*", (req, res) => {
     if(invalidIp[req.ip] == undefined){
        invalidIp[req.ip] = 1;
     }
     else{
        invalidIp[req.ip] += 1;
     }
     res.sendStatus(404);
});
app.post('*', (req, res) => {
    if(invalidIp[req.ip] == undefined){
       invalidIp[req.ip] = 1;
    }
    else{
       invalidIp[req.ip] += 1;
    }
    res.sendStatus(404);
});
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));