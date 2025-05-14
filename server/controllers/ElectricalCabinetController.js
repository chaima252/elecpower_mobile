const ElectricalCabinet = require("../models/ElectricalCabinet");
const Project = require("../models/Project");
const e = require("../utils/error");
const QRCodeLib = require("qrcode");
const QRCode = require("../models/QRCode");
const Material = require("../models/Material");



//! Create a new electrical cabinet
const createElectricalCabinet = async (req, res, next) => {
    try {
        const { projectId, name, description } = req.body;
    
        // Validate required fields
        if (!projectId || !name) {
            return next(e.errorHandler(400, "Project ID and name are required"));
        }

        // 1. Verify the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return next(e.errorHandler(404, "Project not found"));
        }

        // 2. Check if project already has a cabinet
        if (project.electricalCabinetId) {
            return next(e.errorHandler(400, "Project already has an electrical cabinet"));
        }
    
        // 3. Create a new electrical cabinet
        const cabinet = new ElectricalCabinet({
            name,
            description: description || "",
            projectId,
            materials: [],
            qrCodeId: null,
            maintenanceHistory: [],
        });
    
        // 4. Save the cabinet to the database
        await cabinet.save();

        // 5. Update the project with the new cabinet ID
        project.electricalCabinetId = cabinet._id;
        await project.save();
    
        // 6. Return success response with both cabinet and updated project
        res.status(201).json({ 
            success: true, 
            message: "Electrical cabinet created and linked to project successfully",
            cabinet,
            project: await Project.findById(projectId).populate('electricalCabinetId')
        });
    } catch (error) {
        next(error);
    }
};

//! Add materials to electrical cabinet
// const addMaterialsToCabinet = async (req, res, next) => {
//     try {
//         const { cabinetId } = req.params;
//         const { materials } = req.body; // Array of { materialId, quantity }
    
//         // Validate required fields
//         if (!materials || !Array.isArray(materials)) {
//         return next(e.errorHandler(400, "Materials array is required"));
//         }
    
//         // Find the cabinet by ID
//         const cabinet = await ElectricalCabinet.findById(cabinetId);
    
//         // Check if the cabinet exists
//         if (!cabinet) {
//         return next(e.errorHandler(404, "Cabinet not found"));
//         }
    
//         // Add materials to the cabinet
//         cabinet.materials = materials;
//         await cabinet.save();
    
//         // Return the updated cabinet
//         res.status(200).json({ success: true, data: cabinet });
//     } catch (error) {
//         next(error);
//     }
// };

const assignMaterialsToCabinet = async (req, res) => {
  try {
    const { cabinetId } = req.params;
    const { materials } = req.body;

    // Validate input
    if (!Array.isArray(materials)) {
      return res.status(400).json({ error: "Materials must be an array" });
    }

    // Validate and transform materials
    const materialsToAssign = materials.map(m => ({
      material: m.material,  // Note: Your schema expects 'material' not 'materialId'
      quantity: Number(m.quantity)
    }));

    // Check materials exist
    const materialCheck = await Promise.all(
      materialsToAssign.map(m => Material.findById(m.material))
    );
    
    if (materialCheck.some(m => !m)) {
      return res.status(404).json({ error: "One or more materials not found" });
    }

    // Update cabinet
    const updatedCabinet = await ElectricalCabinet.findByIdAndUpdate(
      cabinetId,
      { materials: materialsToAssign },
      { new: true }
    ).populate("materials.material");

    res.status(200).json(updatedCabinet);

  } catch (error) {
    console.error("Assignment error:", error);
    res.status(500).json({ 
      error: "Server error during assignment",
      details: error.message
    });
  }
};



//! Get electrical cabinet by project ID
const getCabinetByProjectId = async (req, res, next) => {
    try {
        const { projectId } = req.params;
    
        // Find the cabinet by project ID
        const cabinet = await ElectricalCabinet.findOne({ projectId })
            .populate("qrCodeId") // Populate QR code
            .populate('materials.material');
    
        // Check if the cabinet exists
        if (!cabinet) {
            return next(e.errorHandler(404, "Cabinet not found"));
        }
    
        // Return the cabinet
        res.status(200).json({ success: true, data: cabinet });
        } catch (error) {
        next(error);
        }
    };
//! Get electrical cabinet by cabinet ID
const getCabinetByCabinetId = async (req, res, next) => {
    try {
        const { cabinetId } = req.params;
    
        // Find the cabinet by project ID
        const cabinet = await ElectricalCabinet.findById(cabinetId)
            .populate("qrCodeId") // Populate QR code
            .populate("projectId")
            .populate('materials.material');
    
        // Check if the cabinet exists
        if (!cabinet) {
            return next(e.errorHandler(404, "Cabinet not found"));
        }
    
        // Return the cabinet
        res.status(200).json({ cabinet });
        } catch (error) {
        next(error);
        }
    };

//! get all cabinets
const getAllCabinets = async (req, res, next) => {
    try {
      // Fetch all projects from the database
        const cabinets = await ElectricalCabinet.find()
            .populate("materials", "reference designation quantity") // Populate materials
            .populate("qrCodeId", "code"); // Populate QR code 
    
        // Return the list of cabinets
        res.status(200).json({ cabinets });
        } catch (error) {
            next(error);
       
        }
    };



  //! Update maintenance history
const updateMaintenanceHistory = async (req, res, next) => {
    try {
        const { cabinetId } = req.params;
        const { date, description } = req.body;
    
        // Validate required fields
        if (!date || !description) {
            return next(e.errorHandler(400, "Date and description are required"));
        }
    
        // Find the cabinet by ID
        const cabinet = await ElectricalCabinet.findById(cabinetId);
    
        // Check if the cabinet exists
        if (!cabinet) {
            return next(e.errorHandler(404, "Cabinet not found"));
        }
    
        // Add maintenance entry
        cabinet.maintenanceHistory.push({ date, description });
        await cabinet.save();
    
        // Return the updated cabinet
        res.status(200).json({ success: true, data: cabinet });
        } catch (error) {
        next(error);
        }
    };


    //! update a cabinet by ID
    const updateCabinet = async (req, res, next) => {
        const { cabinetId } = req.params;
        const updatedFields = req.body;
        try {
            // check if cabinet exist
            const cabinet = await ElectricalCabinet.findById(cabinetId);
            if (!cabinet) {
            return next(e.errorHandler(404, "Cabinet not found"));
            }
    
            //update cabinet
            const updatedCabinet = await ElectricalCabinet.findByIdAndUpdate(cabinetId, updatedFields, {
            new: true,
            });
    
            res.status(200).json(updatedCabinet);
        } catch (error) {
            next(error);
        }
    };




    //! GENERATE QRCODE
    

const generateCabinetQRCode = async (req, res) => {
  const { cabinetId } = req.params;

  try {
    const cabinet = await ElectricalCabinet.findById(cabinetId);
    if (!cabinet) return res.status(404).json({ error: "Cabinet not found" });

    if (cabinet.qrCodeId) {
      return res.status(400).json({ error: "QR Code already exists" });
    }

    // Use API_URL from .env for mobile app compatibility
    const data = `${process.env.API_URL}/cabinets/${cabinetId}`;
    
    // Generate data URL for QR code
    const qrDataUrl = await QRCodeLib.toDataURL(data);

    // Create and save new QRCode document
    const newQRCode = new QRCode({
      code: cabinetId,
      data: qrDataUrl,
      projectId: cabinet.projectId,
      electricalCabinet: cabinet._id,
    });

    await newQRCode.save();

    // Link to cabinet
    cabinet.qrCodeId = newQRCode._id;
    await cabinet.save();

    res.status(201).json({ message: "QR Code generated", qrCode: newQRCode });
  } catch (error) {
    console.error("QR Generation Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


//! Update QR code scan timestamp
const scanCabinetQRCode = async (req, res) => {
  const { cabinetId } = req.params;

  try {
    const cabinet = await ElectricalCabinet.findById(cabinetId);
    if (!cabinet) {
      return res.status(404).json({ error: "Cabinet not found" });
    }
    if (!cabinet.qrCodeId) {
      return res.status(400).json({ error: "No QR code associated with this cabinet" });
    }

    const qrCode = await QRCode.findById(cabinet.qrCodeId);
    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    qrCode.lastScannedAt = new Date();
    await qrCode.save();

    res.status(200).json({ success: true, message: "QR code scan recorded", qrCode });
  } catch (error) {
    console.error("QR Scan Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//! Update material checked or missing status
const updateMaterialStatus = async (req, res, next) => {
    try {
        const { cabinetId, materialId } = req.params;
        const { checked, missing } = req.body;

        // Validate input
        if (checked === undefined && missing === undefined) {
            return next(e.errorHandler(400, "At least one of checked or missing must be provided"));
        }

        // Find the cabinet and update the specific material
        const update = {};
        if (checked !== undefined) update["materials.$.checked"] = checked;
        if (missing !== undefined) update["materials.$.missing"] = missing;

        const cabinet = await ElectricalCabinet.findOneAndUpdate(
            { _id: cabinetId, "materials._id": materialId },
            { $set: update },
            { new: true }
        ).populate("materials.material");

        if (!cabinet) {
            return next(e.errorHandler(404, "Cabinet or material not found"));
        }

        res.status(200).json({ success: true, data: cabinet });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    createElectricalCabinet,
    getCabinetByProjectId,
    getCabinetByCabinetId,
    updateMaintenanceHistory,
    getAllCabinets,
    updateCabinet,
    assignMaterialsToCabinet,
    generateCabinetQRCode,
    updateMaterialStatus,
    scanCabinetQRCode,
    
    };