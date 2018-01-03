var json = "";
var view = "1.json";
var blink_emergency;
var blink_battery;
var odometer_count;
var dashboardVisible = [];
var dashboardHidden = [];
var stream = "";

//window.addEventListener('load', function()
document.addEventListener("DOMContentLoaded", function(event)
{
    loadView("views/" + view, function(data)
    {
        //console.log(data);
        json = data;

        document.body.style.backgroundImage = "url('views/bg/" + data.background + "')"; 

        buildView("front");
        renderView("front");
        renderView("back");

        animateView();

    }, function(xhr) { console.error(xhr); });
});

function animateView()
{
    document.gauges.forEach(function(gauge) {

        if (gauge.options.enabled == true)
        {
            //console.log("... animate " + gauge.options.renderTo);

            gauge.value = gauge.options.maxValue;

            setTimeout(function() {
                gauge.value = gauge.options.minValue;
                //streamView();
            }, gauge.options.animationDuration*1.5);
        }
    });

    //new SVGInjector().inject(document.querySelectorAll("img.svg-inject"));
};

function sizeView()
{
    for (var i = 0, l = document.gauges.length; i < l; i++) {

        var gauge = document.gauges[i];

        if (gauge.options.enabled == true) {

            //console.log("... adjust size " + gauge.options.renderTo);

            gauge.options.width = Math.round(getWidth() / dashboardVisible.length); // * gauge.options.width);
            gauge.options.height = Math.round(getHeight() - 100) ; //dashboardVisible.length);// * gauge.options.height);
            gauge.update();

            var td = document.getElementById(gauge.options.renderTo);
            td.parentElement.width = gauge.options.width;
            td.parentElement.height = gauge.options.height;
        }
    }
};

function buildView(view)
{
    if(view === "front")
    {
        var front = document.getElementsByClassName("front");
        var table = document.getElementById("frontTable");
        var tr = document.getElementById("frontRow");

        for (var i = 0, l = json.dashboard.length; i < l; i++)
        {
            var td = document.getElementById( "canvasIndex" + i);

            if (!(td instanceof HTMLCanvasElement)) {

                var td = document.createElement("td");
                td.id = "canvasIndex" + i;
                tr.appendChild(td);

                json.dashboard[i].width = Math.round(getWidth()/3);
                json.dashboard[i].height = json.dashboard[i].width;
            }
        }
    }
};

function renderView(view)
{
    //console.log(json);

    if(view === "front")
    {
        stream = "din_emcystop,din_ocur";
        dashboardVisible = [];
        dashboardHidden = [];

        var front = document.getElementsByClassName("front");
        var table = document.getElementById("frontTable");

        for (var i = 0, l = json.dashboard.length; i < l; i++)
        {
            var render = document.getElementById(json.dashboard[i].renderTo);
            var td = document.getElementById( "canvasIndex" + json.dashboard[i].index);

            if(json.dashboard[i].enabled)
            {
                console.log(json.dashboard[i].renderTo);

                switch (json.dashboard[i].renderTo) {
                    case "battery":
                    stream += ",udc";
                    break;
                case "speed":
                    stream += ",rpm";
                    break;
                }

                if (render instanceof HTMLCanvasElement)
                {
                    //if element exists we want to verify canvasindex is correct
                    console.log(render.parentElement.id + " > " + json.dashboard[i].index);

                    if(render.parentElement.id !== "canvasIndex" + json.dashboard[i].index)
                    {
                        console.log("index incorrect ...moving canvas");

                        render.parentElement.width = 0;
                        render.remove();
                        td.appendChild(render);
                    }

                }else{
                    //console.log(JSON.stringify(json.dashboard[i],null, 2));

                    var canvas = document.createElement("canvas");
                    canvas.id = json.dashboard[i].renderTo;
                    td.appendChild(canvas);

                    new RadialGauge(json.dashboard[i]).draw();
                }

                dashboardVisible.push(json.dashboard[i]);

            }else{

                if (render instanceof HTMLCanvasElement) {
                    console.log("...hide canvas " + json.dashboard[i].renderTo);
                    render.parentElement.width = 0;
                    render.remove();
                }

                dashboardHidden.push(json.dashboard[i]);
            }
        }

        sizeView();

        //var odometer = CANRead("distance");

        if(json.odometer)
        {
            var tr = document.createElement("tr");
            //tr.id = "odometer";
            var td = document.createElement("td");
            td.colSpan = dashboardVisible.length;

            var canvas = document.createElement("canvas");
            canvas.id = "odometer";
            canvas.height = 32;
            canvas.width = 200;

            td.appendChild(canvas);
            tr.appendChild(td);
            table.appendChild(tr);

            display = new SegmentDisplay("odometer",json.odometer);
            display.draw();
            display.setValue(json.odometer.count);
            //updateOdometer(json.odometer.count);
        }
        
        // ======= Alert Icons =======
        var maxH = [];
        for (var i = 0; i < json.dashboard.length; i++)
            maxH.push(document.getElementById("canvasIndex" + i).height);
        var s = (getHeight() - Math.max.apply(null,maxH));

        var alerts = document.getElementById("frontAlerts");
        alerts.innerHTML = "";

        var td = buildAlertList(false, s);
        td.colSpan = json.dashboard.length;

        //fixes flip rotation for svg
        for (var i = 0, l = td.childNodes.length; i < l; i++)
            td.childNodes[i].style="";

        alerts.appendChild(td);
        // ===========================

        front[0].onclick = function () {
            //console.log(this);
            this.parentElement.style.cssText = "transform:rotateX(180deg); -webkit-transform:rotateX(180deg);";
        };
        /*
        for (i in json.sounds)
        {
            if(json.sounds[i].play)
            {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "sounds/" + json.sounds[i].id, true);
                xhr.responseType = "arraybuffer";
                xhr.onload = function(e){
                    window.addEventListener("keydown", createPitchStep(json.sounds[i].pitchStep))
                    window.addEventListener("keyup", createPitchStep(-json.sounds[i].pitchStep))
                    engineStart(this.response);
                };
                xhr.send();
                break;
            }
        }
        */
        
    }else if (view === "back") {

        var back = document.getElementsByClassName("back");

        var divA = document.createElement("div");
        var divB = document.createElement("div");
        var table = document.createElement("table");

        var tr = document.createElement("tr");
        var td = document.createElement("td");
        divA.appendChild(buildGaugeList(dashboardHidden,"15%"));
        td.appendChild(divA);
        tr.appendChild(td);
        table.appendChild(tr);

        var tr = document.createElement("tr");
        var td = document.createElement("td");
        var t = document.createElement("table");
        divB.appendChild(buildGaugeList(dashboardVisible,"20%"));
        td.height="400";
        td.appendChild(divB);
        tr.appendChild(td);
        table.appendChild(tr);

        var tr = document.createElement("tr");
        var td = buildAlertList(true,80);
        td.height="300";
        tr.appendChild(td);
        table.appendChild(tr);

        [].forEach.call(divA.getElementsByClassName('tile__list'), function (el){
            Sortable.create(el, {
                group: 'photo',
                animation: 150,
                /*
                onChoose: function (evt) {
                    evt.item.setAttribute('width', "16%");
                },
                */
                onAdd: function (event) {
                    //evt.from;
                    event.item.setAttribute('width', "15%");

                    sortView(el, event, false);
                    renderView("front");
                }
            });
        });
        [].forEach.call(divB.getElementsByClassName('tile__list'), function (el){
            Sortable.create(el, {
                group: 'photo',
                animation: 150,
                /*
                onChoose: function (evt) {
                    evt.item.setAttribute('width', "24%");
                },
                */
                onAdd: function (event) {
                    //event.from;
                    event.item.setAttribute('width', "20%");

                    sortView(el, event, true);
                    renderView("front");
                    saveView();
                },
                //onUpdate: function (event) {
                onSort: function (event) {

                    sortView(el, event, true);
                    renderView("front");
                    saveView();
                }
            });
        });
        
        back[0].appendChild(table);

        back[0].onclick = function () {
            //console.log(this);
            this.parentElement.style.cssText = "";
            setTimeout(function(){
                animateView(); 
            }, 1000);
        };
    }

    //TODO: Detect idle mode and slow down stream
    new SVGInjector().inject(document.querySelectorAll('.svg-inject'));
};

function sortView(el, event, enabled)
{
    for (var e = 0; e < el.children.length; e++)
    {
        for (i in json.dashboard)
        {
            if ("_" + json.dashboard[i].renderTo === el.children[e].id)
            {
                //console.log(el.children[e].id + ":" + e);
                
                json.dashboard[i].index = e;
                json.dashboard[i].enabled = enabled;
                break;
            }
        }

        for (var i = 0, l = document.gauges.length; i < l; i++)
        {
            var gauge = document.gauges[i];
            if ("_" + gauge.options.renderTo == el.children[e].id) {
                gauge.options.index = e;
                gauge.options.enabled = enabled;
                break;
            }
        }
    }
    //console.log(event.item.id);
    //console.log(event.newIndex);
};

function buildAlertList(showAll,size)
{
    var td = document.createElement("td");

    for (i in json.alerts)
    {
        //console.log(json.alerts[i].svg);
        if(json.alerts[i].enabled == true || showAll) {
            var span = document.createElement("span");
            var svg = document.createElement("img");
            var x = size / 2;

            if(showAll)
                x = size / 3;

            svg.dataset.color = json.alerts[i].color;
            svg.classList.add("svg-inject");
            svg.classList.add("svg-grey");
            svg.style.width = size + "px";
            svg.style.height = size + "px";
            svg.src = "img/" + json.alerts[i].id + ".svg";
            //svg.setAttribute("data-fallback", "img/" + json.alerts[i].id + ".png");
            span.style.position = "relative"; 
            span.style.zIndex = "1";
            span.id = "alert_" + json.alerts[i].id;
            span.appendChild(svg);

            span.onclick = function (e) {
                //console.log(this);
                //console.log(this.children[1].src);
                e.preventDefault();
                e.stopPropagation();

                var yesno = false;

                if(this.children[1].src.indexOf("disabled") !== -1)
                {
                    yesno = true;

                    this.children[1].src = "img/enabled.svg";

                    var lightboxBody = document.getElementById("lightboxBody");
                    var lightboxTitle = document.getElementById("lightboxTitle");
                    lightboxBody.innerHTML = ""; //empty

                    if(this.id =="alert_background")
                    { 
                        var ul = document.createElement("ul");
                        ul.classList.add("slides");

                        //TODO: loop through all background
                        loadView("views/bg/index.json", function(data)
                        {
                            var nav_dots = document.createElement("li");
                            nav_dots.classList.add("nav-dots");

                            for (var u = 0; u < data.index.length; u++)
                            {
                                var div = document.createElement("div");
                                var li = document.createElement("li");
                                var nav = document.createElement("div");
                                var label_prev = document.createElement("label");
                                var label_next = document.createElement("label");
                                var label = document.createElement("label");
                                var input = document.createElement("input");
                                var img = document.createElement("img");

                                div.classList.add("slide");
                                li.classList.add("slide-container");
                                nav.classList.add("nav");
                                label.classList.add("nav-dot");
                                label_prev.classList.add("prev");
                                label_next.classList.add("next");
                                
                                var input = document.createElement("input");
                                input.type = "radio";
                                input.name = "radio-btn";
                                input.id = "img-" + u;
                                input.checked = true;

                                img.src = "views/bg/" + data.index[u].file;
                                div.appendChild(img);
                                li.appendChild(div);

                                label.setAttribute("for", "img-" + u);
                                label.id = "img-dot-" + u;
                                
                                let prev = (u-1);
                                if(u == 0)
                                    prev = (data.index.length-1);
                                label_prev.innerHTML = "&#x2039";
                                label_prev.setAttribute("for", "img-" + prev);
                                nav.appendChild(label_prev);

                                let next = (u+1);
                                if(u == data.index.length-1)
                                    next = 0;
                                label_next.innerHTML = "&#x203a;";
                                label_next.setAttribute("for", "img-" + next);
                                nav.appendChild(label_next);

                                li.appendChild(nav);
                                ul.appendChild(input);
                                ul.appendChild(li);

                                img.onclick = function (e) {
                                    console.log(this.src);
                                    json.background = this.src;
                                    document.body.style.backgroundImage = "url('views/bg/" + this.src + "')";
                                    window.location = "#close";
                                    saveView();
                                };
                            }
                            ul.appendChild(nav_dots);
                        });

                        lightboxBody.appendChild(ul);

                        window.location = "#openModal";
                    }
                    else if(this.id =="alert_rfid")
                    {
                        var rfid = document.createElement("textarea");
                        
                        lightboxTitle.innerHTML = "RFID Unlock";
                        rfid.rows = "20";

                        rfid.placeholder = "Unlock Codes (MIFARE Protocol 13.56 Mhz)";

                        lightboxBody.appendChild(rfid);

                        window.location = "#openModal";
                    }
                    else if(this.id =="alert_wifi-ap")
                    {
                        var ssid = document.createElement("input");
                        var ip = document.createElement("input");
                        var password = document.createElement("input");

                        lightboxTitle.innerHTML = "WiFi Access Point";
                        ssid.type = "text";
                        ip.type = "text";
                        password.type = "password";

                        ssid.placeholder = "Access Point Name (SSID)";
                        ip.placeholder = "Access Point IP (/24)";
                        password.placeholder = "Access Point Password (WPA2)";

                        lightboxBody.appendChild(ssid);
                        lightboxBody.appendChild(ip);
                        lightboxBody.appendChild(password);

                        window.location = "#openModal";
                    }
                    else if(this.id =="alert_wifi-alarm")
                    {
                        var email = document.createElement("input");
                        var smtp = document.createElement("input");
                        var username = document.createElement("input");
                        var password = document.createElement("input");

                        lightboxTitle.innerHTML = "WiFi Alarm Notification";
                        email.type = "text";
                        smtp.type = "text";
                        username.type = "text";
                        password.type = "password";

                        email.placeholder = "Email";
                        smtp.placeholder = "Email Server (SMTP)";
                        username.placeholder = "Email Username";
                        password.placeholder = "Email Password";

                        email.value = json.wifi.email;
                        smtp.value = json.wifi.smtp;
                        username.value = json.wifi.username;
                        password.value = json.wifi.password;

                        lightboxBody.appendChild(email);
                        lightboxBody.appendChild(smtp);
                        lightboxBody.appendChild(username);
                        lightboxBody.appendChild(password);

                        window.location = "#openModal";

                        save.onclick = function (e) {

                            json.wifi.email = email.value;
                            json.wifi.smtp = smtp.value;
                            json.wifi.username = username.value;
                            json.wifi.password = password.value;

                            window.location = "#close";
                        };
                    }

                }else{
                    this.children[1].src = "img/disabled.svg";
                }

                console.log("...set alert '" + this.id.substr(6) + "' " + yesno);

                for (i in json.alerts)
                {
                    if(json.alerts.id === this.id.substr(6))
                    {
                        json.alerts[i].enabled = yesno;
                        break;
                    }
                }
            };

            if(showAll)
            {
                var overlay = document.createElement("img");
                overlay.classList.add("svg-inject");
                if(json.alerts[i].enabled)
                {
                    overlay.src = "img/enabled.svg";
                }else{
                    overlay.src = "img/disabled.svg";
                }
                overlay.style.cssText = "position:relative;top:" + x + "px;left:-" + x + "px;width:" + x + "px;height:" + x + "px;";
                span.appendChild(overlay);
                //new SVGInjector().inject(overlay);
            }

            td.appendChild(span);
            //new SVGInjector().inject(svg);
        }
    }

    return td;
};

function buildGaugeList(array,size,title)
{
    var tile = document.createElement("div");
    tile.classList.add("tile");
    //tile.dataset.force = array.length;
    var tile_list = document.createElement("div");
    tile_list.classList.add("tile__list");

    if(title)
    {
        var tile_name = document.createElement("div");
        tile_name.classList.add("tile__name");
        tile_name.textContent = title;
        //tile_name.style.display = "none";
        tile.appendChild(tile_name);
    }
    
    var back = document.getElementsByClassName("back");
    
    for (var i = 0; i < array.length; i++) {

        var e = array[i].enabled;

        array[i].enabled = false; //does not put these into active gauge list
        array[i].renderTo = "_" + array[i].renderTo; //set temporary id

        var canvas = document.createElement("canvas");
        canvas.id = array[i].renderTo;
        back[0].appendChild(canvas);
        var gauge = new RadialGauge(array[i]).draw();
        canvas.remove();

        var ctx = canvas.getContext('2d');
        var img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.id = array[i].renderTo;
        img.setAttribute('width', size);
        tile_list.appendChild(img);

        img.onclick = function (e) {

            e.preventDefault();
            e.stopPropagation();

            var lightboxBody = document.getElementById("lightboxBody");
            lightboxBody.innerHTML = ""; //empty

            var code = document.createElement("textarea");
            code.rows = "20";
            code.id = "code" + this.id;

            for (i in json.dashboard)
            {
                if("_" + json.dashboard[i].renderTo === this.id)
                {
                    code.value = JSON.stringify(json.dashboard[i], null, 2);
                    break;
                }
            }
            lightboxBody.appendChild(code);

            window.location = "#openModal";

            code.onchange = function (e) {

                //console.log(this.value);

                for (i in json.dashboard)
                {
                    if("code_" + json.dashboard[i].renderTo === this.id)
                    {
                        json.dashboard[i] = JSON.parse(this.value);
                        break;
                    }
                }
                renderView("front");
                saveView();
            };
        };

        //set options back
        array[i].enabled = e;
        array[i].renderTo = array[i].renderTo.substr(1);
    }

    tile.appendChild(tile_list);

    return tile;
};

function streamView(path)
{
    var _alert = document.getElementsByClassName("alert");

	var xhr = new XMLHttpRequest();
    xhr.open('GET', "serial.php?stream=" + stream, true);
    xhr.send();
	
	xhr.onreadystatechange = function()
	{
		console.log("State change: "+ xhr.readyState);

		if(xhr.readyState == 3) {
            
			var newData = xhr.response.substr(xhr.seenBytes);
			if(newData !== "Unknown command sequence")
			{
				console.log(newData);
                
                /*
                blink_emergency = setInterval(function() 
                {
                    var svg = document.getElementById("emergency");

                    if(svg.className.baseVal.indexOf(svg.dataset.color) !== -1) {
                        svg.classList.remove("svg-orange");
                        svg.classList.add("svg-grey");
                    }else{
                        svg.classList.remove("svg-grey");
                        svg.classList.add("svg-orange");
                    }
                    new SVGInjector().inject(svg);
                }, 1000);
                clearInterval(blink_emergency);
                */

                /*
                var svg = document.getElementById("battery");
                svg.classList.add(svg.dataset.color);
                new SVGInjector().inject(svg);
                */

			}
			xhr.seenBytes = xhr.responseText.length;
			//console.log("seenBytes: " +xhr.seenBytes);
			_alert.style.display = "none";
		}else if (xhr.readyState == 4) {
			//console.log("Complete");
			//console.log(xhr.responseText);
			_alert.innerHTML = "Connection Lost";
			_alert.style.display = "block";
		}
	};
	xhr.addEventListener("error", function(e) {
	  console.log("error: " +e);
	});
};

function loadView(path, success, error)
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", path, true);
    //xhr.setRequestHeader('Content-Type', 'application/json'); 
    xhr.send();

    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
					if(path.indexOf(".json") !== -1) {
						success(JSON.parse(xhr.responseText));
					}else{
						success(xhr.responseText);
					}
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
};

function saveView()
{   
    console.log("saving view");

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'views/save.php', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        // do something to response
        console.log(this.responseText);
    };
    xhr.send('view=' + view + '&json=' + JSON.stringify(json));
};

function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    //document.documentElement.scrollWidth,
    //document.body.offsetWidth,
    //document.documentElement.offsetWidth,
    //document.documentElement.clientWidth
  );
};

function getHeight() {
  return Math.max(
    //document.body.scrollHeight,
    //document.documentElement.scrollHeight,
    //document.body.offsetHeight,
    //document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
};

function updateOdometer(n) {
    n += 0.01
    odometer_count.setValue(n);
    setTimeout(function(){updateOdometer(n)}, 80);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad();
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  var d = R * c;
  return d;
};

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
};
