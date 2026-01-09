import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFData {
  instituteName?: string;
  departmentName: string;
  feedbackTitle: string;
  academicTerm?: string;
  facultyName?: string;
  program?: string;
  year?: string;
  courseName?: string;
  lectureQuestions?: Array<{ question: string; percentage: number }>;
  labQuestions?: Array<{ question: string; percentage: number }>;
  generalQuestions?: Array<{ question: string; percentage: number }>;
  lectureAverage?: number;
  labAverage?: number;
  feedbackType: string;
}

export function generateFeedbackPDF(data: PDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const instituteName = data.instituteName || 'Institute Name';
  const instituteWidth = doc.getTextWidth(instituteName);
  doc.text(instituteName, (pageWidth - instituteWidth) / 2, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const deptText = `Department: ${data.departmentName}`;
  const deptWidth = doc.getTextWidth(deptText);
  doc.text(deptText, (pageWidth - deptWidth) / 2, yPos);
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const titleText = data.feedbackTitle.toUpperCase();
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
  yPos += 8;

  if (data.academicTerm) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const termText = `Academic Term: ${data.academicTerm}`;
    const termWidth = doc.getTextWidth(termText);
    doc.text(termText, (pageWidth - termWidth) / 2, yPos);
    yPos += 10;
  }

  yPos += 5;

  // Lecture Section (for MSE/ESE)
  if ((data.feedbackType === 'MSE_FEEDBACK' || data.feedbackType === 'ESE_FEEDBACK') && data.lectureQuestions && data.lectureQuestions.length > 0) {
    const lectureData = data.lectureQuestions.map(q => [q.question, `${q.percentage.toFixed(2)}%`]);
    
    // Add average row
    if (data.lectureAverage !== undefined) {
      lectureData.push(['Average (Theory)', `${data.lectureAverage.toFixed(2)}%`]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Question', 'Aggregate Percentage']],
      body: lectureData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    // @ts-ignore - jsPDF autoTable plugin adds lastAutoTable
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Lab Section (for MSE/ESE)
  if ((data.feedbackType === 'MSE_FEEDBACK' || data.feedbackType === 'ESE_FEEDBACK') && data.labQuestions && data.labQuestions.length > 0) {
    const labData = data.labQuestions.map(q => [q.question, `${q.percentage.toFixed(2)}%`]);
    
    // Add average row
    if (data.labAverage !== undefined) {
      labData.push(['Average (Lab)', `${data.labAverage.toFixed(2)}%`]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Question', 'Aggregate Percentage']],
      body: labData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    // @ts-ignore - jsPDF autoTable plugin adds lastAutoTable
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // General Questions (for COURSE_EXIT)
  if (data.feedbackType === 'COURSE_EXIT' && data.generalQuestions && data.generalQuestions.length > 0) {
    const generalData = data.generalQuestions.map(q => [q.question, `${q.percentage.toFixed(2)}%`]);

    autoTable(doc, {
      startY: yPos,
      head: [['Question', 'Aggregate Percentage']],
      body: generalData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    // @ts-ignore - jsPDF autoTable plugin adds lastAutoTable
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  yPos = pageHeight - 30;

  if (data.facultyName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Faculty: ${data.facultyName}`, margin, yPos);
    yPos += 5;
  }

  doc.text(`Department: ${data.departmentName}`, margin, yPos);

  // Save PDF
  const fileName = `${data.feedbackTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}
