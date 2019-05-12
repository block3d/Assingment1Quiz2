// Import the stuff for the express framework
const express=require('express');

const sessions=require('client-sessions');

const bodyParser=require("body-parser");

const mysql=require('mysql');

var app=express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessions({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));


var mysqlConn=mysql.createConnection({
      host:"localhost",
      user:"appaccount",
      password:"apppass",
      multipleStatements:true


});



function fetchJournal(user){

 let query = "USE users; SELECT journal from appusers where username='" + user+"'";
 var match=false;
 let journal="";
 mysqlConn.query(query, function(err, qResult){

     if(err) throw err;

      console.log(qResult[1]);
      qResult[1].forEach(function(account){
      journal=account['journal'];
      console.log(journal);
       match = true;

    });
    if (match){

      return journal;
    }
   });




};

app.get("/", function(req, res){









        if(req.session.username){
        res.redirect('/dashboard');
      }
      else
      {
        res.sendFile(__dirname+"/index.html");
      }



    });

app.get('/register.html',function(req,res){

      res.sendFile(__dirname+"/register.html");

});

app.get('/dashboard',function(req,res){

  // Is this user logged in? Then show the dashboard
      if(req.session.username)
      {

        let query = "USE users; SELECT journal from appusers where username='" + req.session.username+"'";
        var match=false;
        let journal="";
        mysqlConn.query(query, function(err, qResult){

            if(err) throw err;

             console.log(qResult[1]);
             qResult[1].forEach(function(account){
             journal=account['journal'];
            journal = journal.replace(/\n/g, '<br>');
              match = true;

           });
           if (match){

            res.render('dashboard', {username: req.session.username,journal:journal});
           }
          });

      }
      //Not logged in! Redirect to the mainpage
      else
      {
          res.redirect('/');
      }


});

// The end-point for creating an account
app.post("/login", function(req, res){
    var userName=req.body.username;
    var password=req.body.password;
    // Construct the query
   var query = "USE users; SELECT username,password from appusers where username='" + userName + "' AND password='" + password + "'";
   console.log(query);


   // Query the DB for the user
   mysqlConn.query(query, function(err, qResult){

       if(err) throw err;

       console.log(qResult[1]);

       // Does the password match?
       var match = false;

       // Go through the results of the second query
       qResult[1].forEach(function(account){

           if(account['username'] == userName && account['password'] == password)
           {
               console.log("Match!");

               // We have a match!
               match = true;

               //break;

           }
       });

       // Login succeeded! Set the session variable and send the user
       // to the dashboard
       if(match)
       {
           req.session.username = userName;
           res.redirect('/dashboard');
       }
       else
       {
           // If no matches have been found, we are done
           res.send("Wrong");
       }
   });


});


app.post("/update", function(req, res){
  console.log(req.body);
  console.log(req.body.journal);
  updated=false;
  let query = "USE users; UPDATE appusers SET journal='"+req.body.journal+ "'where username='" + req.session.username+"'";

  mysqlConn.query(query, function(err, qResult){
  if (err) throw err;
    console.log("Journal record(s) updated");
    updated=true;

  if(updated)
  {
      res.redirect('/dashboard');
  }
  else
  {
      // If no matches have been found, we are done
      res.send("Failed to update");
  }

});




});
app.get('/logout', function(req, res){

    // Kill the session
    req.session.reset();

    res.redirect('/');
});

app.listen(3000);
