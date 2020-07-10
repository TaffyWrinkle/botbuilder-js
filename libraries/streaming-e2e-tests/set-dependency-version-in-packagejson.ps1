param($LatestVersion)
$path = "$(System.DefaultWorkingDirectory)/samples/javascript_nodejs/02.echo-bot/package.json";
$package = 'botbuilder';
$newVersion = "$(LatestVersion)";

$find = "$package`": `"\S*`"";
$replace = "$package`": `"$newVersion`"";

Get-ChildItem -Path "$path" | % {
    $_.FullName; 
    $content = Get-Content -Raw $_.FullName;

    $content -Replace "$find", "$replace" | Set-Content $_.FullName;
    '-------------'; get-content $_.FullName; '==================='
}
displayName: 'Set dependency reference to latest version'