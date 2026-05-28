param(
    [string]$ApiUrl = "http://localhost:8000",
    [string]$VenvDir = ".venv",
    [switch]$SkipSystemDeps,
    [switch]$GenerateFrontendEnv,
    [switch]$SkipFrontendEnv,
    [switch]$SkipTranskunCheck,
    [string]$PythonExe
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Message)
    Write-Host "[WidiAI] $Message"
}

function Get-PythonInfo {
    param(
        [string]$Command,
        [string[]]$Args
    )

    $versionText = & $Command @Args --version 2>&1
    if ($versionText -notmatch "(\d+)\.(\d+)\.(\d+)") {
        throw "Unable to parse Python version from: $versionText"
    }
    $version = [Version]::new($Matches[1], $Matches[2], $Matches[3])
    return @{ Version = $version; Text = $versionText }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
Set-Location $RepoRoot

$PythonCmd = $PythonExe
$PythonArgs = @()

if (-not $PythonCmd) {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        $PythonCmd = "python"
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        $PythonCmd = "py"
        $PythonArgs = @("-3")
    }
}

if (-not $PythonCmd) {
    throw "Python 3.8+ is required. Install Python or pass -PythonExe to the installer."
}

$pythonInfo = Get-PythonInfo -Command $PythonCmd -Args $PythonArgs
if ($pythonInfo.Version -lt [Version]"3.8") {
    throw "Python 3.8+ required. Found $($pythonInfo.Text)."
}
if ($pythonInfo.Version -ge [Version]"3.13") {
    Write-Warning "Python 3.13+ may break transkun/audioop. Use 3.8-3.12 if you see errors."
}

if (-not $SkipSystemDeps) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Step "Installing FFmpeg via winget (if not already installed)"
        winget install --id Gyan.FFmpeg -e --silent --accept-package-agreements --accept-source-agreements
    } else {
        Write-Warning "winget not found. Install FFmpeg manually if transkun fails."
    }

    if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
        Write-Warning "ffmpeg not found in PATH. The backend will try WinGet paths, but PATH is recommended."
    }
    if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
        Write-Warning "ffprobe not found in PATH. The backend will try WinGet paths, but PATH is recommended."
    }
}

$ShouldGenerateFrontendEnv = $GenerateFrontendEnv -and -not $SkipFrontendEnv

$VenvPath = Join-Path $RepoRoot $VenvDir
if (-not (Test-Path $VenvPath)) {
    Write-Step "Creating virtual environment at $VenvPath"
    & $PythonCmd @PythonArgs -m venv $VenvPath
}

$VenvPython = Join-Path $VenvPath "Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    throw "Virtual environment python not found at $VenvPython"
}

Write-Step "Upgrading pip"
& $VenvPython -m pip install --upgrade pip

Write-Step "Installing Python dependencies"
& $VenvPython -m pip install -r (Join-Path $RepoRoot "requirements.txt")

if (-not $SkipTranskunCheck) {
    $TranskunExe = Join-Path $VenvPath "Scripts\transkun.exe"
    if (-not (Test-Path $TranskunExe)) {
        Write-Warning "transkun executable not found in venv. Verify installation if transcription fails."
    }
}

if ($ShouldGenerateFrontendEnv) {
    $EnvExample = Join-Path $RepoRoot ".env.frontend.example"
    $EnvFile = Join-Path $RepoRoot ".env.frontend"

    if (-not (Test-Path $EnvFile)) {
        if (Test-Path $EnvExample) {
            Copy-Item $EnvExample $EnvFile
        }
    }

    if ($ApiUrl) {
        Set-Content -Path $EnvFile -Value "WIDI_API_URL=$ApiUrl"
    }

    Write-Step "Generating frontend env.js"
    & $VenvPython (Join-Path $RepoRoot "scripts\generate_frontend_env.py")
}

Write-Step "Done. Activate the venv and run: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"
