import { Component, TemplateRef, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';
import {
  ModalDismissReasons,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProductsComponent } from "../products/products.component";
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-amounts',
    standalone: true,
    templateUrl: './amounts.component.html',
    styleUrl: './amounts.component.scss',
    imports: [ReactiveFormsModule,
        CommonModule,
        NgbDatepickerModule, ProductsComponent]
})
export class AmountsComponent {
  username: string = '';
  allUser: any = [];
  userForm: any = FormGroup;
  totalAmount: number = 0;
  totalAverage: number = 0;
  id: number = 0;
  returnUserDetails: any = [];
  selectUser: any = [];
  userName: any = FormGroup;
  name: any = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.userName = this.fb.group({
      name: [''],
    });
    this.getLocalStorageData();
    this.formInitialization();
  }

  onSaveName() {
    localStorage.setItem('userName', JSON.stringify(this.userName.value));
    this.getLocalStorageData();
  }

  getLocalStorageData() {
    const userName = localStorage.getItem('userName');

    if (userName) {
      this.name = JSON.parse(userName);
      console.log(this.name.name);
    }

    const data = localStorage.getItem('allUsers');
    if (data) {
      this.allUser = JSON.parse(data);
      this.calculateTotalAmount();
    } else {
      console.error('Not Get data ');
    }
  }

  formInitialization() {
    this.userForm = this.fb.group({
      id: [''],
      img: [''],
      name: [''],
      amount: [''],
    });
  }

  getRandomImage(): string {
    return `https://i.pravatar.cc/48?u=${Math.random()}`;
  }

  generateUniqueId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  onSave() {
    const FormData = this.userForm.value;
    FormData.id = this.generateUniqueId();
    FormData.img = this.getRandomImage();
    this.allUser.push(FormData);
    localStorage.setItem('allUsers', JSON.stringify(this.allUser));
    this.updateLocalStorage();
    this.calculateTotalAmount();
    this.userForm.reset();
  }

  calculateTotalAmount() {
    const countTotal = this.allUser.reduce(
      (acc: number, users: any) => acc + parseInt(users.amount),
      0
    );
    this.totalAmount = countTotal;
    this.totalAverage = this.calculate(this.totalAmount, this.allUser.length);
    this.calculateReturnAmount();
  }

  calculate = (total: number, totalUser: number) => {
    return Math.floor(total / totalUser);
  };

  calculateReturnAmount() {
    this.allUser.forEach((user: any) => {
      user.returnAmount = this.payAmount(user.amount, this.totalAverage);
    });
    this.updateLocalStorage();
  }

  payAmount(userAmount: number, totalAverage: number): number {
    const returnBalance = totalAverage - userAmount;
    if (returnBalance <= 0) {
      return 0;
    } else {
      return returnBalance;
    }
  }

  updateLocalStorage() {
    localStorage.setItem('allUsers', JSON.stringify(this.allUser));
  }
  clearDb() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able remove all data ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('allUsers');
        this.allUser = [];
        this.totalAmount = 0;
        this.totalAverage = 0;
        Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire('Cancelled', 'Your data is safe :)', 'error');
      }
    });
  }

  onRemove(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        this.allUser = this.allUser.filter((item: any) => item.id !== id);
        this.updateLocalStorage();
        Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire('Cancelled', 'Your data is safe :)', 'error');
      }
    });
  }

  onSelectUser(item: any) {
    this.selectUser = item;
  }

  getReturnAmountUsers() {
    return this.allUser.filter((user: any) => user.returnAmount > 0);
  }

  private modalService = inject(NgbModal);
  closeResult = '';

  open(content: TemplateRef<any>) {
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  private getDismissReason(reason: any): string {
    switch (reason) {
      case ModalDismissReasons.ESC:
        return 'by pressing ESC';
      case ModalDismissReasons.BACKDROP_CLICK:
        return 'by clicking on a backdrop';
      default:
        return `with: ${reason}`;
    }
  }

  downloadPDF() {
    const data = document.getElementById('pdfContent');
    if (data) {
      html2canvas(data).then((canvas) => {
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        const doc = new jsPDF('p', 'mm', 'a4');
        let position = 10; // starting position with margin

        doc.addImage(canvas, 'PNG', 10, position, imgWidth - 20, imgHeight); // adjust for left margin

        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(canvas, 'PNG', 10, position, imgWidth - 20, imgHeight); // adjust for left margin
          heightLeft -= pageHeight;
        }

        doc.save('user-data.pdf');
      });
    }
  }

  shareData() {
    const shareContent = `Total Amount : ${this.totalAmount}`;

    if (navigator.share) {
      navigator
        .share({
          title: 'Share Data ',
          text: 'Check Out this data form Split money APP',
          url: window.location.href,
        })
        .then(() => console.log('Shared Successfully '))
        .catch((error) => console.error(error));
    } else {
      navigator.clipboard
        .writeText(shareContent)
        .then(() => {
          Swal.fire('Data Copied', 'Data copied to clipboard', 'success');
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error);
          Swal.fire('Error', 'Failed to copy data to clipboard', 'error');
        });
    }
  }
}
