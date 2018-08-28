//our username 
var name; 
var connectedUser;
  
//connecting to our signaling server 
var conn = new WebSocket('ws://localhost:9090');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
};
  
//when we got a message from a signaling server 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);
	
   var data = JSON.parse(msg.data);
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success);
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   } 
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages 
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   conn.send(JSON.stringify(message)); 
};


var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');

var callPage = document.querySelector('#callPage');
var callTousernameInput = document.querySelector('#callTousernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');


loginBtn.addEventListener("click", function(event){ 
   name = usernameInput.value; 
	
   if(name.length > 0){ 
      send({ 
         type: "login",
         name: name 
      }); 
   } 
	
});


var localVideo = document.querySelector("#localVideo");
var remoteVideo = document.querySelector("#remoteVideo");

var yourConn;
var stream;

//when a user logs in 
function handleLogin(success) { 

   if (success === false) { 
      alert("oops...try a different username"); 
   } else {
	 	  
         navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) { 
         stream = myStream; 
	 try {
            localVideo.srcObject = stream;
             } catch (error) {
               localVideo.src = window.URL.createObjectURL(stream);
             }		
			
         var configuration = { 
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302"}]
          };

          yourConn = new webkitRTCPeerConnection(configuration);
    
          yourConn.addStream(stream);

          yourConn.onaddstream = function(e) {
            try {
               remoteVideo.srcObject = e.stream;
             } catch (error) {
               remoteVideo.src = window.URL.createObjectURL(e.stream);
             }	
          };

        yourConn.onicecandidate = function (event) { 
		
         if (event.candidate) { 
            send({ 
               type: "candidate",
               candidate: event.candidate 
            }); 
         
         }
      };

    }, function (error) {
       console.log(error);
    });
  }
};


callBtn.addEventListener("click", function () { 
 
   var callToUsername = callToUsernameInput.value; 
   connectedUser = callToUsername;
	
   if (callToUsername.length > 0) { 
      //make an offer 
      yourConn.createOffer(function (offer) { 
         console.log(); 
         send({ 
            type: "offer", 
            offer: offer 
         });
			
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("An error has occurred."); 
      }); 
   } 
});


//when somebody wants to call us 
function handleOffer(offer, name) { 
   connectedUser = name; 
   yourConn.setRemoteDescription(new RTCSessionDescription(offer)); 
	
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("oops...error when Creating answer"); 
   }); 
};

//when another user answers to our offer 
function handleAnswer(answer) { 
   yourConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};

//when we got ice candidate from another user 
function handleCandidate(candidate) { 
   yourConn.addIceCandidate(new RTCIceCandidate(candidate)); 
}; 

hangUpBtn.addEventListener("click", function () {

  send({
      type: "leave"
   });

  handleLeave();
});

function handleLeave() {
   connectedUser = null;
   remoteVideo.src = null;

   yourConn.close();
   yourConn.onicecandidate = null;
   yourConn.onaddstream = null;
};

 

         

        