-- Migration: Replace ANALYST with OPTOMETRIST
-- This migration updates the database schema to replace ANALYST with OPTOMETRIST

-- Step 1: Update existing users with ANALYST role to OPTOMETRIST
UPDATE `User` SET `role` = 'OPTOMETRIST' WHERE `role` = 'ANALYST';

-- Step 2: Update JourneyStep enum - change ANALYST to OPTOMETRIST in existing records
UPDATE `PatientJourney` SET `currentStep` = 'OPTOMETRIST' WHERE `currentStep` = 'ANALYST';

-- Step 3: Modify UserRole enum to replace ANALYST with OPTOMETRIST
ALTER TABLE `User` MODIFY COLUMN `role` ENUM('PATIENT', 'OPTOMETRIST', 'DOCTOR', 'ADMIN', 'PHARMACY') NOT NULL;

-- Step 4: Modify JourneyStep enum to replace ANALYST with OPTOMETRIST  
ALTER TABLE `PatientJourney` MODIFY COLUMN `currentStep` ENUM('REGISTRATION', 'PAYMENT', 'OPTOMETRIST', 'DOCTOR', 'PHARMACY', 'COMPLETED') NULL;

-- Step 5: Rename analystId column to optometristId in EyeTest table
ALTER TABLE `EyeTest` CHANGE COLUMN `analystId` `optometristId` VARCHAR(191) NULL;

-- Step 6: Rename analystNotes column to optometristNotes in EyeTest table
ALTER TABLE `EyeTest` CHANGE COLUMN `analystNotes` `optometristNotes` VARCHAR(191) NULL;

-- Step 7: Update foreign key constraint name (MySQL will handle this automatically with CHANGE COLUMN)
