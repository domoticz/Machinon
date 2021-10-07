<?php

namespace Remachinon\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'devices';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'muid', 'description'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
    ];

    /**
     * A device belongs to a single user
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo('Remachinon\Models\User');
    }

    /**
     * A device has one single tunnel
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function device_tunnel()
    {
        return $this->hasOne('Remachinon\Models\DeviceTunnel');
    }

}
