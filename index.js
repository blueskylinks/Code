firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
	document.getElementById('message').style.display="none";
	document.getElementById('display').style.display="block";
  } else {
    // No user is signed in.
	document.getElementById('message').style.display="block";
	document.getElementById('display').style.display="none";
  }
});

function login_user(){
	var name=document.getElementById('email').value;
	var pass=document.getElementById('pass').value;
	firebase.auth().signInWithEmailAndPassword(name, pass).catch(function(error) {
	// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
  
		window.alert("Error:"+errorMessage);
	// ...
	});

}
function logout(){
	firebase.auth().signOut();
  
}