let mSettings = $("#appnavbar").find("li[has-permission='Admin']");
if (mSettings && mSettings.length > 0) {
    mSettings.removeClass("dropdown"); 
    mSettings.children("a").removeClass("dropdown-toggle");
    mSettings.find("a > b").remove();
    mSettings.children("ul").remove();

    mSettings.click(function() {
        $("#machinoSettings").remove();
        $("#appnavbar li").removeClass("current_page_item");
        $("#mSettings").addClass("current_page_item");
        $("#search").addClass("readonly");
        $(".navbar-inner").removeClass("slide");
        $("body").css("overflow", "auto");
        if ($("#holder #main-view #machinoSettings").length === 0) {
            $("#holder #main-view").empty();
            $("#holder #main-view").append('<div id="machinoSettings" class="container-fluid">');
            $("#machinoSettings").append('<ul class="mHeaderBtn">').append('<div class="page-header-small"><h1 data-i18n="Settings">Settings</h2></div>').append('<ul class="machinon_ul">');
            $("#machinoSettings ul.mHeaderBtn").append('<li class="btn btn-danger" onclick="javascript:SwitchLayout(\'Restart\')"><i class="ion-ios-refresh"></i><div data-i18n="Restart System">Restart System</div></li><li class="btn btn-danger" onclick="javascript:SwitchLayout(\'Shutdown\')"><i class="ion-ios-power"></i><div data-i18n="Shutdown System">Shutdown System</div></li><li class="btn btn-danger" onclick="location.href=\'#Logout\'"><i class="ion-ios-log-out"></i><div data-i18n="Logout">Logout</div></li>');
            $("#machinoSettings ul.machinon_ul").append(
				/*Hardware*/
				'<li class="rectangle-8" onclick="location.href=\'#Hardware\'"><img src="images/settings/hardware.png"><div class="machinoText" data-i18n="Hardware">Hardware</div></li>');
			$("#machinoSettings ul.machinon_ul").append(
				'<li class="rectangle-8" onclick="location.href=\'#Devices\'"><img src="images/settings/devices.png"><div class="machinoText" data-i18n="Devices">Devices</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#Setup\';showThemeSettings();"><img src="images/settings/setup.png"><div class="machinoText" data-i18n="Settings">Settings</div></li>');
			$("#machinoSettings ul.machinon_ul").append(
				'<li class="rectangle-8" onclick="javascript:CheckForUpdate(true)"><img src="images/settings/update.png"><div class="machinoText" data-i18n="Check for Update">Check for Update</div></li>');
			$("#machinoSettings ul.machinon_ul").append(
				'<li class="rectangle-8" onclick="location.href=\'#Cam\'"><img src="images/settings/cam.png"><div class="machinoText" data-i18n="Cameras">Cameras</div></li>');
			$("#machinoSettings ul.machinon_ul").append(
				'<li class="rectangle-8" onclick="location.href=\'#Users\'"><img src="images/settings/users.png"><div class="machinoText" data-i18n="Edit Users">Edit Users</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#Events\'"><img src="images/settings/events.png"><div class="machinoText" data-i18n="Events">Events</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#CustomIcons\'"><img src="images/settings/customicons.png"><div class="machinoText" data-i18n="Custom Icons">Custom Icons</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#Applications\'"><img src="images/settings/app.png"><div class="machinoText" data-i18n="Applications">Applications</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#Mobile\'"><img src="images/settings/mobile.png"><div class="machinoText" data-i18n="Mobile Devices">Mobile Devices</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8-dropdown"><img src="images/settings/plan.png"><div class="machinoText" data-i18n="Roomplan">Roomplan</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#UserVariables\'"><img src="images/settings/variables.png"><div class="machinoText" data-i18n="User variables">Uservariables</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'secpanel/index.html#{{config.language}}\'"><img src="images/settings/security.png"><div class="machinoText" data-i18n="SecurityPanel">Security Panel</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#Notification\'"><img src="images/settings/notification.png"><div class="machinoText" data-i18n="Send Notification">Send Notification</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8-dropdown"><img src="images/settings/contact.png"><div class="machinoText" data-i18n="Data push">Data push</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#MyProfile\'"><img src="images/settings/userprofile.png"><div class="machinoText" data-i18n="My Profile">My Profile</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#Log\'"><img src="images/settings/log.png"><div class="machinoText" data-i18n="Log">Log</div></li>');
			$("#machinoSettings ul.machinon_ul").append(	
				'<li class="rectangle-8" onclick="location.href=\'#About\'"><img src="images/settings/about.png"><div class="machinoText" data-i18n="About">About</div></li>');
            $("#machinoSettings li.rectangle-8-dropdown").append('<div class="dropdown-content rectangle-8">');
            $("#machinoSettings li.rectangle-8-dropdown").has('div.machinoText[data-i18n="Roomplan"]').children("div.dropdown-content").append('<p><a href="#Roomplan"><div class="mDropdown-Text"><span data-i18n="Roomplan">Roomplan</span></div></a></p><p><a href="#Floorplanedit"><div class="mDropdown-Text"><span data-i18n="Floorplan">Floorplan</span></div></a></p><p><a href="#Timerplan"><div class="mDropdown-Text"><span data-i18n="Timerplan">Timerplan</span></div></a></p>');
            $("#machinoSettings li.rectangle-8-dropdown").has('div.machinoText[data-i18n="Data push"]').children("div.dropdown-content").append('<p><a href="#DPFibaro"><div class="mDropdown-Text">FibaroLink</div></a></p><p><a href="#DPHttp"><div class="mDropdown-Text">HTTP</div></a></p><p><a href="#DPGooglePubSub"><div class="mDropdown-Text">Google PubSub</div></a></p><p><a href="#DPInflux"><div class="mDropdown-Text">InfluxDB</div></a></p>');
            $("#machinoSettings").i18n();
            if (!isAdmin()) $("#machinoSettings").remove();
        }
    });
}
