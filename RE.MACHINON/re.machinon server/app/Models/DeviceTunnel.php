<?php

namespace Remachinon\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceTunnel extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'device_tunnels';

    /**
     * Default attributes of a tunnel (empty all)
     * @todo cannot use this due to guarded attributes and mass update U_U
     *
     * @var array
     */
    public static $defaults = [
        'port'       => null,
        'uuid'       => null,
        'is_enabled' => false
    ];

    protected $guarded = [
        'port', 'uuid', 'is_enabled'
    ];

    protected $hidden = [
        'port'
    ];

    /**
     * A tunnel belongs to a single device
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function device()
    {
        return $this->belongsTo('Remachinon\Models\Device');
    }

    public static function generate_pin($randomNumberLength = 6)
    {
        $randomNumberTolerance = 3;				//set variable for amount identical integers to be tolerated
        do {
            $stringCountBoo = 0;				//set variable
            $number = ''; 						//set variable
            for ($i = 0; $i < $randomNumberLength; $i++) {	//loop through length
                $number .= rand(0,9);			//set random number and concatenate
            }
            for ($i=0;$i<strlen($number);$i++) {	//set random number and concatenate
                $stringCount = substr_count($number, $number[$i]); //count the amount of each integer in the PIN
                if ($stringCount == $randomNumberTolerance) {		//check integer account against tolerance variable
                    $stringCountBoo = 0;
                    break;
                } else {
                    $stringCountBoo = 1;
                }
            }
        } while ($stringCountBoo == 0);  	//continue until $stringCountBoo is satisfied
        return (string)$number;
    }
}
