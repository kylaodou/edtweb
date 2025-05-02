// Script pour l'export PDF
// Ce fichier sera inclus dans l'index.html

// Fonction pour convertir un élément HTML en PDF
function exportToPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Élément non trouvé:', elementId);
    return;
  }

  // Options pour html2canvas
  const options = {
    scale: 2, // Meilleure qualité
    useCORS: true, // Pour les images externes
    allowTaint: true,
    backgroundColor: '#ffffff'
  };

  // Convertir l'élément HTML en canvas
  html2canvas(element, options).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    
    // Créer un nouveau document PDF
    const pdf = new jspdf.jsPDF({
      orientation: 'landscape', // Paysage pour l'emploi du temps
      unit: 'mm',
      format: 'a4'
    });
    
    // Dimensions du PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculer les dimensions de l'image pour qu'elle s'adapte au PDF
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10; // Marge en haut
    
    // Ajouter l'image au PDF
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Télécharger le PDF
    pdf.save(filename);
  });
}
