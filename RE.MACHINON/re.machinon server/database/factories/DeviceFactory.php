<?php

use Faker\Generator as Faker;

$factory->define(Remachinon\Models\Device::class, function (Faker $faker) {
    return [
        'name' => $faker->streetName,
        'muid' => $faker->unique()->regexify('[A-F0-9]{12}'),
        'description' => $faker->sentence(6),
        'is_enabled' => $faker->boolean(60)
    ];
});
