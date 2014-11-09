<?php
@set_time_limit(0); // don't abort if it takes to long
header("Content-type: application/force-download");
header("Content-Transfer-Encoding: Binary");
header("Content-length: 100");
header('Content-disposition: attachment; filename="slow.txt"');

for($i = 0; $i < 10; $i++) {
    echo "0123456789";
    flush();
    sleep(1);
}