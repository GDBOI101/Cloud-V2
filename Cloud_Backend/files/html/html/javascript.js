 //Login Form
function form1(){
	var username=document.forms["loginform"]["username"].value;
	     var pwd=document.forms["loginform"]["pwd"].value;


if(username==null || username==""){
	document.getElementById("errorbox").innerHTML = "Enter the Usename";
	return false;
}

if(pwd==null || pwd==""){
	document.getElementById("errorbox").innerHTML = "Enter the Password";
	return false;
}

if(username != '' && pwd != ''){
	alert("Login successfully");
}
}


//Signup Form

function form2(){


	var signup_username=document.forms["signupform"]["signup_username"].value;
	var signup_useremail=document.forms["signupform"]["signup_useremail"].value;
	var signup_pwd=document.forms["signupform"]["signup_pwd"].value;
	var repwd=document.forms["signupform"]["repwd"].value;



	 
	if(signup_username==null || signup_username=="" ){
                  document.getElementById("errorbox").innerHTML = "Enter the User Name";
                 return false;
        }

        if(signup_useremail==null || signup_useremail==""){
                  document.getElementById("errorbox").innerHTML =
                   "Enter the E-mail";
                 return false;
        }

        if(signup_pwd==null || signup_pwd==""){
                  document.getElementById("errorbox").innerHTML =
                   "Enter the Password";
                 return false;
        }

        if(repwd==null || repwd==""){
                  document.getElementById("errorbox").innerHTML =
                   "Enter the Retype Password";
                 return false;
             }

 		if(signup_pwd != repwd){
                  document.getElementById("errorbox").innerHTML = "Password Don't Match";
                 return false;
             }
        

        if (signup_username != '' && signup_useremail != '' && signup_pwd != '' && repwd != '' && signup_pwd == repwd)


          alert("Register/Signup Successfull");
                         

}
