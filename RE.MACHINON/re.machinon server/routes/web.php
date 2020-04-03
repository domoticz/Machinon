<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', 'HomeController@index');

Auth::routes();

Route::group(['middleware' => 'auth'], function() {

    // Updating own user profile
    Route::get('profile/edit', 'UserController@edit')->name('profile.edit');
    Route::get('user/{user}/edit', 'UserController@edit')->name('user.edit');
    Route::patch('user/{user}/update', 'UserController@update')->name('user.update');
    // Download remachinon server key
    Route::get('devices/getkey', 'DeviceController@getkey')->name('devices.getkey');
    // Tunneling routes
    Route::get('devices/{id}/connect', 'DeviceTunnelController@connect')->middleware('throttle:4,1')->name('devices.connect');
    Route::get('devices/{id}/disconnect', 'DeviceTunnelController@disconnect')->name('devices.disconnect');
    Route::get('tunnels/{id}/status', 'DeviceTunnelController@status')->name('tunnels.status');
    // Basic CRUD routes
    Route::resource('devices', 'DeviceController');
});
