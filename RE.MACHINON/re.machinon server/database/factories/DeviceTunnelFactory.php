<?php

use Faker\Generator as Faker;

$factory->define(Remachinon\Models\DeviceTunnel::class, function (Faker $faker) {
    return [
        'is_enabled' => false,
    ];
});
