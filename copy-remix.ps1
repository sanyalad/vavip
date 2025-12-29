# Script to copy files from remix repository to frontend/
$remixBranch = "remix/main"
$targetDir = "frontend"

# List of files and directories to copy from remix
$filesToCopy = @(
    ".dockerignore",
    ".eslintrc.cjs",
    ".gitattributes",
    "CHANGELOG.md",
    "Dockerfile",
    "Dockerfile.prod",
    "env.example",
    "index.html",
    "nginx.conf",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "public",
    "src"
)

Write-Host "Copying files from $remixBranch to $targetDir..."

foreach ($item in $filesToCopy) {
    Write-Host "Copying: $item"
    git show "$remixBranch`:$item" > "$targetDir\$item" 2>&1
    
    # For directories, we need to handle them differently
    if ($item -eq "public" -or $item -eq "src") {
        # Use git archive for directories
        git archive "$remixBranch" "$item" | tar -x -C "$targetDir" 2>&1
    }
}

Write-Host "Done!"

