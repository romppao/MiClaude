"use client";
import { Component, type ReactNode } from "react";
/** Un fallo de un módulo decorativo nunca debe retirar el contenido del servidor. */
export default class EffectBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?null:this.props.children;}
}
