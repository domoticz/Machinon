
# Re:Machinon - server 
  
## Work in progress  
  
ReMachinon is a web app created with Laravel framework that allows to register and connect to your Machinon devices remotely from anywhere in the world without any NAT, VPN or complicated router configurations.  
  
*Note: This software requires some knowledge of Apache and MySQL basic configuration*  
  
# Server requirements  
  
+ Apache 2.2+  
+ PHP 7.2  
+ MySQL 5.7  
+ SSHd  
+ Node.js (url)  
+ Composer (url)  
  
This software requires the use of Machinon devices with the following packets installed:  
  
+ Web Machinon - https://github.com/EdddieN/web_machinon
+ Agent Machinon - https://github.com/EdddieN/agent_machinon
  
You can get requirements, installation and setup details in each package's Github page.  
  
# ToDo  
  
- [ ] Visual styles  
- [ ] User groups  
- [ ] Global permissions  
- [ ] TLS on MQTT connections

# Done

- [X] User web authentication  
- [X] User API authentication  
- [X] Device registration  
- [X] Device tunnel connection and disconnection  
  
# Server setup  
   
#### Apache  
  
You need to setup a VirtualHost on the apache server that contains special dynamic reverse proxy tunneling directives.  
Use the Hostname, DocumentRoot that fit your needs  
The proxy file path directive must fit the installation DocumentRoot chosen.  

Addendum: To check how to install the server check the following documentation:
[Re:Machinon access install guide](https://github.com/EdddieN/machinon/blob/master/documentation/remachinon_access_install_guide.md)

```  
TODO  
```  
  
#### MySQL  
Create a MySQL database and set an user and password for the app.  
  
#### SSHd  
  
You must setup a user account on the server to create the tunnels  
  
```  
TODO  
```   
  
# Installing  
  
Go to your Apache /var/www/sites or wherever you want to use as the VirtualHost DocumentRoot folder  
Ensure the folder is **empty**  
  
```
cd /var/www
sudo mkdir -p sites/re.machinon.com
cd sites/re.machinon.com
sudo mkdir logs
sudo git clone https://github.com/EdddieN/remachinon.git
sudo mv remachinon htdocs
sudo touch htdocs/storage/app/domoproxy
sudo chown -R www-data:www-data htdocs logs
sudo chmod ug+w -R htdocs
cd htdocs
```

### Setting environment

Copy the sample .env file and edit it with the required parameters
```
sudo cp .env.example .env
sudo nano .env
```
Set the following parameters, replace the APP_URL with your server's hostname and service passwords with the ones you chose in the previous steps of the installation.
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://<your domain here>

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=remachinon
DB_USERNAME=remachinon
DB_PASSWORD=<the mysql password>

MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=remachinon
MQTT_PASSWORD=<the mosquitto password>
MQTT_CLIENT_ID=remachinon:
```
Also setup your Mail delivery system with your desired settings.

If you want to limit the people that can register new users in the app, you can filter the public IPs that can access to the "User registry" pages with the next directive. Wildcards are allowed.
```
ALLOW_REGISTRY_FROM=127.0.0.1
```

### Installing Composer and Node dependencies

```
composer install --optimize-autoloader --no-dev
npm install --save-prod
npm run prod
```

### Start site with Artisan

```
php artisan optimize
php artisan key:generate
php artisan migrate
php artisan passport:install
```
  
# Updating  
  
```  
cd [remachinon_path]
git pull
composer update --optimize-autoloader --no-dev
nom update --save-prod
npm run prod
php artisan optimize
```  
Add any special php artisan command that may be required by new packages, for example
```
php artisan vendor:publish --tag=telescope-assets
```
** This is just an example. Keep in mind installing Telescope on production requires additional safety steps!!

### Fix permissions

```
sudo chown -R www-data:www-data ../htdocs
```

## Start all services

```
sudo service mosquitto restart
sudo service apache2 restart
sudo service mysql restart
sudo service ssh restart
```

# Usage  
  
- Go to the URL of your webserver  
- Login or register a user  
- Add a new device using your chosen name, the device's MUID (where is the MUID?) and a description.  
- Click on the Connect button and follow instructions.  
  
  
# Additional libraries

Re:Machinon uses the following libraries and packages (apart from Laravel's default ones)
- [spatie/laravel-permissions](https://github.com/spatie/laravel-permission) 
- [bluerhinos/phpmqtt](https://github.com/bluerhinos/phpMQTT)
- [FortAwesome/fontawesome-free](https://github.com/FortAwesome/Font-Awesome)

# License

This software is licensed under the [GPLv3 License](https://www.gnu.org/licenses/gpl-3.0.html)
Check LICENSE file for full details.

> Written with [StackEdit](https://stackedit.io/).
