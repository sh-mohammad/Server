var io = require('socket.io')(process.env.PORT || 3000);
var shortid = require('shortid');
var Rooms = [];
var Playrer_in_Room = [];
console.log("server started");
var Player_Counter = 0;
io.on('connection', function(socket)
{




	var thisroom;

	var thisclaintId = shortid.generate();
	console.log('clienttt connected with Id :', thisclaintId);
	socket.emit("open", { id : thisclaintId});
	socket.on("createroom", function(data){
		//if  exist data.name do send error
		function checkexist(room) {
    		return room == data.name;
		}
		if (Rooms.find(checkexist)) {
			socket.emit("room_exist", {id:thisclaintId})
		}
		//else if data.name not exist do create room
		else{
			socket.join(data.name);
			thisroom = data.name;
			console.log("roome is created with name : " + JSON.stringify(data.name));
			Rooms.push(data.name);
			socket.emit("spawn_hoster" ,{room : data.name, id:thisclaintId});
			Playrer_in_Room.push({
				key: data.name,
				number: 1,
				status: data.Statuse,
				passwordroom: data.Password_Romm,
				id : [thisclaintId]
			});
		}


	});
	socket.on("jointoroom", function(data){
		function checkexist(room) {
    		return room == data.name;
			}
		function findroomname(room) {
		    return data.name == room.key;
		}
		//if  exist this data.name do spawn joiner

		if (Rooms.find(checkexist)) {
			var room = Playrer_in_Room.find(findroomname)
			var number_of_room = room.number;
			if (number_of_room >= 4) {
				socket.emit("room_is_full", {id : thisclaintId});
			}


			else {
				console.log("status is " + room.status);
				if (room.status == "True") {
					console.log(data.name + "is Private");
					if (room.passwordroom != data.password) {
						console.log("room password is" + room.passwordroom + "data password is " + data.password);
						socket.emit("password_errore", {id: thisclaintId});
						return;
					}
				}

				socket.join(data.name);

				thisroom = data.name;
				socket.emit("Go_To_Game");

				socket.to(data.name).emit("spawn_joiner", {room: data.name, id: thisclaintId});

				console.log("the claint with " + thisclaintId + " joined to the " + data.name);
				number_of_room = (++Playrer_in_Room.find(findroomname).number);
				Playrer_in_Room.find(findroomname).id.push(thisclaintId);
				console.log("number of player in " + data.name + " is " + number_of_room);

				socket.to(data.name).emit("requestposition", {room : data.name});

			}
		}
		//else if dadta.name not exist do send error
		else{
			socket.emit("room_not_exist", {room : data.name});
		}


	});
	socket.on("updateposition", function(data){
		data.id = thisclaintId;
		data.room = thisroom;
		console.log("update position ", data);

		socket.to(thisroom).emit("updatap", data);

	});

	socket.on("player move", function(data){
		console.log("Player moved wiht id " + thisclaintId  + "and in room " + thisroom);
		data.id = thisclaintId;
		data.room	= thisroom;
		socket.to(thisroom).emit("move", data);

	});
	socket.on("player rotate", function(data){
		console.log("Player rotate wiht id " + thisclaintId  + "and in room " + thisroom);
		data.id = thisclaintId;
		data.room = thisroom;
		socket.to(thisroom).emit("rotate", data);
	});
	socket.on("disconnect", function(){
		console.log("client with " + thisclaintId + "id disconnect");
		function findroomname(room) {
		    return thisroom == room.key;
		}
		if (thisroom != null) {
			console.log(thisroom);
			if (Playrer_in_Room.find(findroomname).number >= 2) {

					Playrer_in_Room.find(findroomname).number--;
					var index = Playrer_in_Room.find(findroomname).id.indexOf(thisclaintId);
					Playrer_in_Room.find(findroomname).id.splice(index, 1);
					socket.leave(thisroom);
					socket.to(thisroom).emit("client_disconnect", {id : thisclaintId});
			}
			else {
				console.log("delete room " + thisroom);
				var index = Rooms.indexOf(thisroom);
				Rooms.splice(index, 1);
				Playrer_in_Room = Playrer_in_Room.filter( el => el.key !== thisroom );
				socket.leave(thisroom);
				socket.to(thisroom).emit("client_disconnect", {id : thisclaintId});
			//	socket.delete(thisroom);
			}

		}

	});
	socket.on("Refresh_room", function(){
		Playrer_in_Room.forEach(function(room){
			socket.emit("listrooms", {name_room: room.key, status: room.status, number_player_in_room:room.number, number_room: Rooms.length});
		});

	});
	socket.on("OnGameScene", function(){
		function findroomname(room) {
				return thisroom == room.key;
		}
		Playrer_in_Room.find(findroomname).id.forEach(function(playerId){

			if (thisclaintId == playerId) {
					return;
			}
			console.log("hi frome " + playerId + "to " + thisclaintId);
			socket.emit("otherspawner", {id:playerId, room:thisroom});
		});
	});
	socket.on("Fire", function(){
		socket.to(thisroom).emit("OnFire", {id:thisclaintId});
	});

});
