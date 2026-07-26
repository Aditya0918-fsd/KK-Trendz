try {
    const XLSX = require('xlsx');
    const multer = require('multer');
    const express = require('express');
    console.log('All dependencies loaded successfully');
} catch (e) {
    console.error('Dependency Error:', e.message);
    process.exit(1);
}
