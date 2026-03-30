<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['userPrompt'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "userPrompt required"]);
    exit;
}

$payload = json_encode([
    "userPrompt" => $input['userPrompt']
]);

$apiUrl = "https://prosto-calc.vercel.app/api/explain-cost";

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local dev environments often needed

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "CURL Error: " . $error]);
} else {
    http_response_code($httpCode);
    // The Vercel API returns { "result": "..." }
    $responseData = json_decode($response, true);
    if (isset($responseData['result'])) {
        echo json_encode(["status" => "success", "data" => ["explanation" => $responseData['result']]]);
    } else {
        echo $response; // Return original if format is unexpected
    }
}
?>
