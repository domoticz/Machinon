<?php

namespace Remachinon\Models;

use Laravel\Passport\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'email', 'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * A user can register many devices
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function devices() {
        return $this->hasMany('Remachinon\Models\Device');
    }

    /**
     * I think Laravel already has some methods to get User tokens
     * But I've created this as a way to manage them with Eloquent
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function accessTokens() // why not access_tokens?
    {
        return $this->hasMany('Remachinon\Models\OauthAccessToken');
    }

}
